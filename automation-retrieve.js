<script runat="server">
    Platform.Load("Core", "1");
//OPTIONAL: Clear the DE before populating the data extension
    var api = new Script.Util.WSProxy();
    try {
        var DE = DataExtension.Init("Automation_Status");
        DE.Rows.Remove(["flag"], [1]);
    } catch (e) {
        Write(Stringify(e));
    }
//Retrieval of all automations and its properties
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
