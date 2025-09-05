/**
 * Commitlint configuration for Meqenet.et FinTech
 * Enterprise-grade conventional commit enforcement with Jira ticket references
 */

module.exports = {
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
    'jira-ticket-required': [2, 'always']
  },
  parserPreset: {
    parserOpts: {
      // Support multiple ticket formats for Ethiopian FinTech ecosystem
      issuePrefixes: [
        'JIRA-',
        'TICKET-',
        'ISSUE-',
        'MEQ-',
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
          const ticketPattern = /\(?(JIRA|TICKET|ISSUE|MEQ|BNPL|PAY|AUTH|SEC)-\d+\)?$/;
          const invalidRefs = references.filter(ref => !ticketPattern.test(ref.raw));

          if (invalidRefs.length > 0) {
            return [
              false,
              `Invalid ticket format: ${invalidRefs.map(r => r.raw).join(', ')}\n` +
              'Use formats: JIRA-123, TICKET-456, ISSUE-789, MEQ-101, BNPL-202, PAY-303, AUTH-404, SEC-505'
            ];
          }

          return [true];
        }
      }
    }
  ]
};
