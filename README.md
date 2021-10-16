# Email Filter for Sub Production Instances

![Alt](docs/img/finite-logo-75.png "Finite Logo")

## Summary
Allows for multiple users to receive emails sent from sub-production instances.

## Quick Start
* Prerequsites: _none_

1. Download and install update set from [ServiceNow Share](https://developer.servicenow.com/connect.do#!/share/contents/1627055_email_filter_for_sub_production_instances)
2. Set property `Email sending enabled` to TRUE
3. Clear value from property `Send all email to this test email address` property
4. Add desired users to the `SubProd Email Group` group


## Administration
Recommended routine admin tasks:
* Review outbound emails to ensure expected delivery/non-delivery is occurring
* Remind contractors/administrators of configuration (so they don't revert the instance to use a single email address)

## Contribute
Submit enhancements/defects via this repo's [Issues](../../issues)

## Credit
[Garrett Griffin-Morales](https://github.com/garrett-griffin), Adam Hill, [Jarod Mundt](https://github.com/j4rodm)
