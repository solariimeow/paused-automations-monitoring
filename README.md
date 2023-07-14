# Paused Automation Notification with CloudPage

## Use Case
Imagine you are working on an automation task that requires pausing at certain points. However, due to distractions or other responsibilities, you forget to reactivate the automation after resuming your tasks. As a result, the automation remains inactive and continues to go unnoticed for an extended period of time. This lack of activity adversely affects the integrity of your data, causing delays and potential errors in your workflow.

## Problem Case
The challenge arises from the absence of a built-in mechanism or direct feature within Salesforce Marketing Cloud to notify users about paused automations in the business unit or instance. The lack of notification functionality poses a problem as users may not be aware of paused automations and the potential impact on their workflow. Although an unconventional approach is available to receive notifications for paused automations within SFMC, it's important to note that alternative workarounds may exist depending on specific requirements.

## Solution
This solution allows users to get notified via email through a verification activity and gives an option to the users to see the full list of the paused automations by going to a cloud page. Here are the steps to implement the solution:

1. Build an Automation for Monitoring: Create a new automation that will serve as the monitoring tool for this solution. This automation will handle the flow and execution of the solution.

2. Create a Script Activity to Retrieve Automation Information: As a first step, create a script activity to retrieve all the automations in the business unit using WSProxy. This script activity will also populate a target data extension with the relevant properties of the automations.

3. Set up a Query Activity to Filter Paused Automations: Include a query activity within the automation to filter out the automations with a status of "Paused." This query activity will extract the relevant information from the target data extension populated by the script activity and create a new target data extension specifically for the paused automations.

4. Develop a Cloud Page to Display Paused Automations: Create a cloud page that will serve as an interface for users to view the list of paused automations. Retrieve the data from the target data extension created in the previous step and display them on the cloud page for users to see, without having to log in to SFMC.

5. Configure Email Notifications: Implement an email notification system using a verification activity within the automation. This will allow users to receive email notifications whenever an automation is paused.

With this solution, users will receive email notifications when automations are paused, and they can access a cloud page to view the list of paused automations. This helps keep users informed about the status of their automations and enables them to take appropriate action in a timely manner.


### Automation:
This is how it looks like in the automation:
![image](https://github.com/solariimeow/paused-automations-monitoring/assets/45225495/fb254ed9-4c7d-44e8-aa4d-1adcec6a8c17)

### Data Extensions:
- **Name: Automation_Status**
  - *Description:* This data extension stores all the automations retrieved from the script activity.
  - **Fields:**
    - *Name:* Text(255), Nullable
    - *Status:* Text(50), Nullable
    - *CustomerKey:* Text(50), Primary Key
    - *ModifiedDate:* Text(50), Nullable
    - *LastRunTime:* Text(50), Nullable
    - *LastSaveDate:* Text(50), Nullable
    - *(OPTIONAL) flag:* Text(50), Nullable, Default value "1"
- **Name: Paused_Automations**
  - *Description:* This data extension stores the details of paused automations.
  - **Fields:**
    - *Name:* Text(255), Nullable
    - *Status:* Text(50), Nullable
    - *CustomerKey:* Text(50), Primary Key
    - *ModifiedDate:* Date, Nullable
    - *LastRunTime:* Date, Nullable
    - *LastSaveDate:* Date, Nullable
    - *flag:* Text(50), Nullable, Default value "1"
    - *(OPTIONAL) Market:* Text(50), Nullable

### Script Activity:
*Optional*: The following script includes a step to clear the target data extension, preventing duplication and overpopulation that could consume unnecessary space in your platform.

```js
<script runat="server">
    Platform.Load("Core", "1");
    var api = new Script.Util.WSProxy();
    try {
        var DE = DataExtension.Init("Automation_Status");
        DE.Rows.Remove(["flag"], [1]);
    } catch (e) {
        Write(Stringify(e));
    }
</script>
```
The below script is where the magic happens:
```js
<script runat="server">
    Platform.Load("Core", "1");
    var api = new Script.Util.WSProxy();
    try {
        var automations = retrieveAllAutomations();
        var automationDEName = "Automation_Status";
        var automationDE = DataExtension.Init(automationDEName);

        for (var i = 0; i < automations.length; i++) {
            var automationName = automations[i].Name;
            var automationStatus = automations[i].Status;
            var modifiedDate = automations[i].ModifiedDate;
            var lastRunTime = automations[i].LastRunTime;
            var lastSaveDate = automations[i].LastSaveDate;
            var customerKey = automations[i].CustomerKey;
            var statusString = getStatusString(automationStatus);

            var row = {
                Name: automationName,
                Status: statusString,
                ModifiedDate: modifiedDate,
                LastRunTime: lastRunTime,
                LastSaveDate: lastSaveDate,
                CustomerKey: customerKey
            };
            var status = automationDE.Rows.Add(row);
        }

    } catch (err) {
        Write(Stringify(err));
    }

    function retrieveAllAutomations() {
        var out = [],
            moreData = true,
            reqID = data = null;

        var cols = [
            "Name",
            "Description",
            "CustomerKey",
            "IsActive",
            "CreatedDate",
            "ModifiedDate",
            "Status",
            "ProgramID",
            "CategoryID",
            "LastRunTime",
            "ScheduledTime",
            "LastSaveDate",
            "ModifiedBy",
            "LastSavedBy",
            "CreatedBy",
            "AutomationType",
            "RecurrenceID"
        ];

        var filter = {
            Property: 'Status',
            SimpleOperator: 'IN',
            Value: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8]
        };

        while (moreData) {
            moreData = false;

            if (reqID == null) {
                data = api.retrieve("Automation", cols, filter);
            } else {
                data = api.getNextBatch("Automation", reqID);
            }

            if (data != null) {
                moreData = data.HasMoreRows;
                reqID = data.RequestID;
                for (var i = 0; i < data.Results.length; i++) {
                    out.push(data.Results[i]);
                }
            }
        }

        return out;
    }

    function getStatusString(status) {
        switch (status) {
            case -1:
                return 'Error';
            case 0:
                return 'BuildingError';
            case 1:
                return 'Building';
            case 2:
                return 'Ready';
            case 3:
                return 'Running';
            case 4:
                return 'Paused';
            case 5:
                return 'Stopped';
            case 6:
                return 'Scheduled';
            case 7:
                return 'Awaiting Trigger';
            case 8:
                return 'Inactive Trigger';
            default:
                return '';
        }
    }
</script>
```

### Query Activity:
```sql
SELECT
    Name,
    Status,
    CAST(ModifiedDate AS DATETIME) AS ModifiedDate,
    CustomerKey,
    CAST(LastRunTime AS DATETIME) AS LastRunTime,
    CAST(LastSaveDate AS DATETIME) AS LastSaveDate,
    LastSavedBy,
    'Test BU' AS Market
FROM
    Automation_Status
WHERE
    Status = 'Paused'
```
To facilitate the manipulation and ordering of the list based on dates instead of strings, it is important to convert the fields ModifiedDate, LastRunTime, and LastSaveDate to the date data type. This conversion ensures that the list can be organized and sorted accurately according to chronological order.

### Cloud Page:
Create a landing page and add the below code in the page:

```html
<h1>Paused Automations List</h1>
<table align="center" border="1" cellpadding="5" style="width:100%">
    <tr>
        <th>Automation Name</th>
        <th>Status</th>
        <th>Last Run Time</th>
        <th>Last Save Date</th>
        <th>Market</th>
    </tr>
    %%[
    SET @numRowsToReturn = 0
    SET @rows = LookupOrderedRows("Paused_Automations", @numRowsToReturn, "LastRunTime DESC", "flag", "1")
    FOR @i = 1 TO RowCount(@rows) DO
    SET @row = Row(@rows, @i)
    SET @name = Field(@row, "Name")
    SET @status = Field(@row, "Status")
    SET @lastRunTime = Field(@row, "LastRunTime")
    SET @lastSaveDate = Field(@row, "LastSaveDate")
    SET @market = Field(@row, "Market")
    ]%%
    <tr>
        <td>%%=v(@name)=%%</td>
        <td>%%=v(@status)=%%</td>
        <td>%%=v(@lastRunTime)=%%</td>
        <td>%%=v(@lastSaveDate)=%%</td>
        <td>%%=v(@market)=%%</td>
    </tr>
    %%[ NEXT @i ]%%
</table>
```
Feel free to display additional fields according to your preferences and requirements.

### Verification Activity:
Configure the verification activity by setting the required condition and trigger actions. Add the recipient email addresses to ensure email notifications are sent. In the note section, include the URL of the cloud page for recipients to easily access and check. Below is an example of the verification activity configuration:

![image](https://github.com/solariimeow/paused-automations-monitoring/assets/45225495/82074c20-3ac4-470f-a732-5e78d141d02b)

### Conclusion:

After completing the necessary configurations and setup, it is essential to schedule your automation according to your requirements. Set a desired schedule to ensure that the automation runs consistently and performs the intended tasks effectively. Regularly monitor the automation's performance and make any necessary adjustments to maintain its smooth operation. By implementing a reliable schedule, you can optimize the efficiency and reliability of your automation process.

#### References:
[Retrieve all Automations | SSJS Docs](https://www.ssjsdocs.xyz/automation-studio/automations/retrieve/all.html)
[Automation | Marketing Cloud APIs and SDKs | Salesforce Developers](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/automation.html)

#### Credits:
Developed this solution by yours truly under **Accenture** license.
