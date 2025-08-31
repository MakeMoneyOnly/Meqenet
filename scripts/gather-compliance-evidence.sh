#!/bin/bash

# gather-compliance-evidence.sh
# Automates the collection of evidence for compliance controls.

set -euo pipefail

# Ensure yq is installed
if ! command -v yq &> /dev/null; then
    echo "yq could not be found. Please install yq to continue."
    echo "See: https://github.com/mikefarah/yq/"
    exit 1
fi

# Directories
COMPLIANCE_DIR="./compliance"
EVIDENCE_DIR="./dist/compliance_evidence"
REPORT_FILE="${EVIDENCE_DIR}/compliance-report.md"

# Clean up previous run
rm -rf "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR"

# --- Report Header ---
cat > "$REPORT_FILE" << EOH
# Compliance Evidence Report

**Generated on:** $(date -u +'%Y-%m-%dT%H:%M:%SZ')

This report contains automatically gathered evidence for the compliance controls defined in the 
$COMPLIANCE_DIR directory.

---
EOH

echo "Starting compliance evidence gathering..."

# Find all control files and process them
find "$COMPLIANCE_DIR" -type f -name '*.yml' | while read -r file; do
    echo "Processing control file: $file"

    FRAMEWORK=$(yq e '.framework' "$file")
    CONTROL_ID=$(yq e '.control_id' "$file")
    DESCRIPTION=$(yq e '.description' "$file")
    NARRATIVE=$(yq e '.implementation_narrative' "$file")

    # --- Add Control to Report ---
    echo "## $FRAMEWORK - $CONTROL_ID" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Description:** $DESCRIPTION" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Implementation Narrative:**" >> "$REPORT_FILE"
    echo "> $NARRATIVE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "### Evidence" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Process each piece of evidence
    yq e -o=j -I=0 '.evidence[]' "$file" | while read -r evidence_json; do
        EVIDENCE_ID=$(echo "$evidence_json" | yq e '.id' -)
        EVIDENCE_TYPE=$(echo "$evidence_json" | yq e '.type' -)
        EVIDENCE_DESC=$(echo "$evidence_json" | yq e '.description' -)
        EVIDENCE_SOURCE=$(echo "$evidence_json" | yq e '.source' -)

        echo "  - Gathering evidence for: $EVIDENCE_ID ($EVIDENCE_TYPE)"

        VALIDATED="\u274c Not Found"
        EVIDENCE_CONTENT="Source file not found: $EVIDENCE_SOURCE"

        # Validate that the source file or directory exists
        if [ -e "$EVIDENCE_SOURCE" ]; then
            VALIDATED="\u2705 Found"
            # For now, just link to the file. In a real implementation, we would extract content.
            EVIDENCE_CONTENT="Source found at: [$EVIDENCE_SOURCE]($EVIDENCE_SOURCE)"
        fi

        # --- Add Evidence to Report ---
        echo "- **$EVIDENCE_ID**" >> "$REPORT_FILE"
        echo "  - **Description:** $EVIDENCE_DESC" >> "$REPORT_FILE"
        echo "  - **Type:** $EVIDENCE_TYPE" >> "$REPORT_FILE"
        echo "  - **Status:** $VALIDATED" >> "$REPORT_FILE"
        echo "  - **Details:** $EVIDENCE_CONTENT" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"

    done

    echo "--- " >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
done

echo "Compliance evidence gathering complete."
echo "Report generated at: $REPORT_FILE"
