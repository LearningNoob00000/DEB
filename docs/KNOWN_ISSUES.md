# File: docs/KNOWN_ISSUES.md

# Known Issues

## Active Issues

### pkg Package Vulnerability (GHSA-22r3-9w55-cj54)

**Status**: Acknowledged and Monitored
**Severity**: Moderate
**Affects**: Development environment only
**Component**: pkg (binary build tool)

#### Details
- Issue Type: Local Privilege Escalation
- Discovery Date: 2024-02-10
- Affects Version: All current versions of pkg

#### Impact
This vulnerability only affects development environments during the binary build process. Production builds and the resulting binaries are not impacted.

#### Mitigation
1. Binary building should only be performed in controlled development environments
2. CI/CD pipelines should use appropriate security controls
3. No impact on production deployments or end users

#### Current Status
- Issue is tracked by pkg maintainers
- No fix currently available
- Monitoring for updates
- Configured npm to allow installation with this known issue

#### Action Items
- [ ] Monitor pkg repository for fixes
- [ ] Evaluate alternative binary packaging solutions
- [ ] Update when fix becomes available

## Security Notes
- This issue is development-time only
- No production impact
- Documented in our security policy
- Regularly monitored for updates
