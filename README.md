# salamander-migration
This repo maintains the migration tools and scripts for Salamander customer migration to Okta.

https://oktawiki.atlassian.net/wiki/display/eng/Salamander+Customer+Migrations

## Prerequisites
To use this tool, you must have a Stormpath export unzipped on your local filesystem. The directory structure should be as follows:
```
├── home/
│   ├── {tenantId}/
│   │   ├── directories/
│   │   │   ├── {directoryId}.json
│   │   │   ├-- ....
│   │   ├── providers/
│   │   │   ├── {directoryId}.json
│   │   │   ├-- ....
│   │   ├── accounts/
│   │   │   ├── {directoryId}/
│   │   │   │   ├── {accountId}.json
│   │   │   │   ├-- ....
│   │   │   ├-- ....
│   │   ├── groups/
│   │   │   ├── {directoryId}/
│   │   │   │   ├── {groupId}.json
│   │   │   │   ├-- ....
│   │   │   ├-- ....
│   │   ├── organizations/
│   │   │   ├── {organizationId}.json
│   │   │   ├-- ....
```
> Note: Providers must match 1:1 with Directories (same filenames).

> Note: The 'accounts' and 'groups' folders should be segmented by {directoryId} so that it's possible to iterate over them by directory.

Here's a concrete example:
```
├── home/
│   ├── tenant123/
│   │   ├── directories/
│   │   │   ├── 5LInED46hB6nv9auaOrIYW.json
│   │   │   ├── 7ZBZLdnlxFsEtIs4BRpUHk.json
│   │   │   ├-- ....
│   │   ├── providers/
│   │   │   ├── 5LInED46hB6nv9auaOrIYW.json
│   │   │   ├── 7ZBZLdnlxFsEtIs4BRpUHk.json
│   │   │   ├-- ....
│   │   ├── accounts/
│   │   │   ├── 5LInED46hB6nv9auaOrIYW/
│   │   │   │   ├── 8LJuP3l2Lke9XWL4Vpie3o.json
│   │   │   │   ├-- ....
│   │   │   ├── 7ZBZLdnlxFsEtIs4BRpUHk/
│   │   │   │   ├── 4DfxGCAyrxNyiqjPQIHfHI.json
│   │   │   │   ├-- ....
│   │   ├── groups/
│   │   │   ├── 5LInED46hB6nv9auaOrIYW/
│   │   │   │   ├── 1iMYLWrjvnc833sPCBVbtU.json
│   │   │   │   ├-- ....
│   │   │   ├── 7ZBZLdnlxFsEtIs4BRpUHk/
│   │   │   │   ├── d72ghS4bBhaqzuUN6ur1g.json
│   │   │   │   ├-- ....
│   │   ├── organizations/
│   │   │   ├── 7O67Ni1CG5bo9E9NLA3kdg.json
│   │   │   ├-- ....
```

> In this example, the "stormpathBaseDir" would be `/home/tenant123`.

### To Install:
```
npm install
```

### To Run:
```
node migrate.js --stormPathBaseDir /path/to/export/data --oktaBaseUrl https://your-org.okta.com --oktaApiToken 5DSfsl4x@3Slt6
```

### Options (all required):
```
  --stormPathBaseDir  (-b)   Root directory where Stormpath export data lives                                                                 
  --oktaBaseUrl       (-u)   Base URL of your Okta tenant                
  --oktaApiToken      (-t)   API token for your Okta tenant (SSWS token)     
```