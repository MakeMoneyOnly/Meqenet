/**
 * Commitlint configuration for Meqenet.et FinTech
 * Enterprise-grade conventional commit enforcement with Jira ticket references
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit format
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'security',
        'style',
        'test'
      ]
    ],
    // Enforce subject case to be lower case or sentence case
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    // Enforce ticket reference for traceability
    'references-empty': [2, 'never'],
    // Enforce minimum subject length
    'subject-min-length': [2, 'always', 10],
    // Enforce maximum subject length
    'subject-max-length': [2, 'always', 100],
    // Enforce body max line length
    'body-max-line-length': [2, 'always', 100],
    // Enforce footer max line length
    'footer-max-line-length': [2, 'always', 100],
    // Custom rule for Jira ticket pattern
    'jira-ticket-required': [2, 'always'],
    // Prevent bypassing enterprise security checks
        'no-verify-flag': [2, 'never'],
        'git-reset-hard': [2, 'never']
  },
  parserPreset: {
    parserOpts: {
      // Support multiple ticket formats for Ethiopian FinTech ecosystem
      issuePrefixes: [
        'JIRA-',
        'TICKET-',
        'ISSUE-',
        'MEQ-',
        'MEQ-CI-',
        'BNPL-',
        'PAY-',
        'AUTH-',
        'SEC-'
      ]
    }
  },
  plugins: [
    {
      rules: {
        'jira-ticket-required': (parsed) => {
          const { references } = parsed;

          if (!references || references.length === 0) {
            return [
              false,
              'Commit must reference a Jira ticket for audit traceability.\n' +
              'Use format: type(scope): description (TICKET-123)\n' +
              'Example: feat(auth): add MFA support (JIRA-456)'
            ];
          }

          // Validate ticket format
          const ticketPattern = /\(?(JIRA|TICKET|ISSUE|MEQ(?:-CI)?|BNPL|PAY|AUTH|SEC)-\d+\)?$/;
          const invalidRefs = references.filter(ref => !ticketPattern.test(ref.raw));

          if (invalidRefs.length > 0) {
            return [
              false,
              `Invalid ticket format: ${invalidRefs.map(r => r.raw).join(', ')}\n` +
              'Use formats: JIRA-123, TICKET-456, ISSUE-789, MEQ-101, MEQ-CI-002, BNPL-202, PAY-303, AUTH-404, SEC-505'
            ];
          }

          return [true];
        },
        'git-reset-hard': (parsed) => {
          const { subject, body } = parsed;
          const fullMessage = `${subject} ${body || ''}`.toLowerCase();

          // Check for various forms of git reset --hard usage
          const resetHardPatterns = [
            /git reset --hard/i,
            /git reset.*hard/i,
            /reset.*hard/i,
            /discard.*changes/i,
            /destroy.*work/i,
            /delete.*files/i
          ];

          const foundPattern = resetHardPatterns.find(pattern => pattern.test(fullMessage));

          if (foundPattern) {
            return [
              false,
              'COMMIT REJECTED: Detected destructive git operation!\n\n' +
              '🚨 DESTRUCTIVE OPERATION: git reset --hard or similar destructive commands are prohibited\n' +
              '💀 This permanently destroys work and violates FinTech development standards\n\n' +
              '❌ FORBIDDEN PATTERNS DETECTED:\n' +
              '   • git reset --hard\n' +
              '   • reset hard\n' +
              '   • discard changes\n' +
              '   • destroy work\n' +
              '   • delete files\n\n' +
              '✅ REQUIRED: Use safe git operations that preserve work\n' +
              '🔄 Safe alternatives: git reset --soft, git stash, git branch\n' +
              '🏛️ Contact team lead for destructive operations: dev@meqenet.et\n\n' +
              '🇪🇹 Ethiopian FinTech Development Standards Enforced'
            ];
          }

          return [true];
        },
        'no-verify-flag': (parsed) => {
          const { subject, body } = parsed;
          const fullMessage = `${subject} ${body || ''}`.toLowerCase();

          // Check for various forms of --no-verify flag usage
          const noVerifyPatterns = [
            /--no-verify/i,
            /--no-verify/g,
            /no.?verify/i,
            /bypass.*check/i,
            /skip.*hook/i,
            /ignore.*pre.?commit/i
          ];

          const foundPattern = noVerifyPatterns.find(pattern => pattern.test(fullMessage));

          if (foundPattern) {
            return [
              false,
              'COMMIT REJECTED: Detected attempt to bypass enterprise security checks!\n\n' +
              '🚨 SECURITY VIOLATION: Using --no-verify or similar bypass flags is strictly prohibited\n' +
              '🔒 This would bypass critical FinTech security and compliance validation\n\n' +
              '❌ FORBIDDEN PATTERNS DETECTED:\n' +
              '   • --no-verify flags\n' +
              '   • Bypass check references\n' +
              '   • Skip hook mentions\n' +
              '   • Ignore pre-commit references\n\n' +
              '✅ REQUIRED: All commits must pass enterprise security validation\n' +
              '🏛️ Contact security team for assistance: security@meqenet.et\n\n' +
              '🇪🇹 Ethiopian FinTech Security Compliance Enforced'
            ];
          }

          return [true];
        }
      }
    }
  ]
};
