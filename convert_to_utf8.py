#!/usr/bin/env python3
import codecs

files = ['.github/workflows/financial-model-bias-testing.yml', '.github/workflows/iac-security-scan.yml']

for f in files:
    try:
        # Read with detected encoding
        with open(f, 'rb') as src:
            raw_content = src.read()

        # Try to decode with different encodings
        content = None
        for encoding in ['utf-8', 'windows-1254', 'mac_roman', 'cp1252']:
            try:
                content = raw_content.decode(encoding)
                print(f'✅ Successfully read {f} with {encoding} encoding')
                break
            except UnicodeDecodeError:
                continue

        if content is None:
            print(f'❌ Could not decode {f} with any known encoding')
            continue

        # Write back as UTF-8
        with open(f, 'w', encoding='utf-8') as dst:
            dst.write(content)
        print(f'✅ Converted {f} to UTF-8')

    except Exception as e:
        print(f'❌ Error processing {f}: {e}')

print('✅ UTF-8 conversion completed')
