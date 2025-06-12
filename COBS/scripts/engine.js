/// <reference path="profile.js" />
/// <reference path="jquery-2.0.2.intellisense.js" />

var Engine = $.klass
({
    _dataUrl: "gamedata/",
    _lastPage: null,
    _requestedPage: null,
    _currentPage: null,
    _profile: null,

    _output: null,
    _input: null,

    _dispStrength: null,
    _dispFate: null,
    _dispCapability: null,
    _dispAgility: null,

    _pageData: null,

    _LONG_EXIT_NAMES: { "n": "north", "s": "south", "e": "east", "w": "west", "ne": "northeast", "nw": "northwest", "sw": "southwest", "se": "southeast", "u": "up", "d": "down" },
    _SHORT_EXIT_NAMES: { "north": "n", "south": "s", "east": "e", "west": "w", "northeast": "ne", "northwest": "nw", "southwest": "sw", "southeast": "se", "up": "u", "down": "d" },

    begin: function ()
    {
        this._initControls();
        this._profile = new Profile()
        this._displayEssences();
        this._loadPage("intro");
    },

    _initControls: function ()
    {
        this._output = $("#output")[0];
        this._input = $("#input")[0];

        this._dispStrength = $("#Strength")[0];
        this._dispFate = $("#Fate")[0];
        this._dispCapability = $("#Capability")[0];
        this._dispAgility = $("#Agility")[0];

        $(this._dispStrength).data("lastVal", 0);
        $(this._dispFate).data("lastVal", 0);
        $(this._dispCapability).data("lastVal", 0);
        $(this._dispAgility).data("lastVal", 0);

        $(this._dispStrength).data("lastFlash", 0);
        $(this._dispFate).data("lastFlash", 0);
        $(this._dispCapability).data("lastFlash", 0);
        $(this._dispAgility).data("lastFlash", 0);

        $(this._input).val("");

        $(this._input).keyup($.proxy(this._onInputKeyUp, this));
    },

    _displayEssences: function ()
    {
        this._updateSingleEssence(this._dispStrength, this._profile.EoStrength);
        this._updateSingleEssence(this._dispFate, this._profile.EoFate);
        this._updateSingleEssence(this._dispCapability, this._profile.EoCapability);
        this._updateSingleEssence(this._dispAgility, this._profile.EoAgility);

        var flashFunc = $.proxy(this._flashEssences, this);
        setTimeout(flashFunc, 800);
    },

    _updateSingleEssence: function (element, value)
    {
        var lastVal = $(element).data("lastVal");
        var title = $(element).attr("title");
        var content = title + ": " + value;

        var flashVal = 0;
        if (lastVal > value)
        {
            flashVal = -9
        }
        else if (lastVal < value)
        {
            flashVal = 9;
        }

        $(element).data("lastVal", value);
        $(element).data("flashVal", flashVal);
        $(element).text(content);
    },

    _flashEssences: function ()
    {
        this._flashSingleEssence(this._dispStrength);
        this._flashSingleEssence(this._dispFate);
        this._flashSingleEssence(this._dispCapability);
        this._flashSingleEssence(this._dispAgility);

        var flashFunc = $.proxy(this._flashEssences, this);
        setTimeout(flashFunc, 800);
    },

    _flashSingleEssence: function (element)
    {
        var flashVal = $(element).data("flashVal");
        var flashClass = "";

        if (flashVal > 0)
        {
            flashClass = "FlashGreen";
            flashVal--;
        }
        else if (flashVal < 0)
        {
            flashClass = "FlashRed";
            flashVal++;
        }

        if (flashClass.length > 0)
        {
            $(element).toggleClass(flashClass);
            $(element).data("flashVal", flashVal);
            if (flashVal == 0)
            {
                $(element).removeClass("FlashRed");
                $(element).removeClass("FlashGreen");
            }
        }
    },

    _loadPage: function (pageId)
    {
        const url = this._dataUrl + pageId + '.json';
        this._requestedPage = pageId;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => this._onPageLoaded(data))
            .catch(error => {
                console.error('Error loading page:', error);
                this._display("Unable to load page with id " + this._requestedPage);
            });
    },

    _onPageLoaded: function (data)
    {
        if (data) {
            this._lastPage = this._currentPage;
            this._currentPage = this._requestedPage;
            this._requestedPage = null;
            this._pageData = data;
            this._processActions(this._pageData.actions);
        } else {
            this._display("Unable to load page with id " + this._requestedPage);
        }
    },

    _processActions: function (actions)
    {
        for (var i = 0; i < actions.length; i++)
        {
            var action = actions[i];
            if (action.stats)
            {
                this._profile.adjustStats(action.stats);
                this._displayEssences();
            }
            if (action.display)
            {
                this._display(action.display);
            }

            if (action.vector)
            {
                this._loadPage(action.vector);
            }

            if (action.modify)
            {
                this._modifyPageData(action.modify);
            }

            if (action.test)
            {
                this._performTest(action);
            }

            if (action.delay)
            {
                this._delayedActions(action);
            }

            if (action.hasitem)
            {
                this._hasItem(action);
            }

            if (action.back)
            {
                this._moveBack();
            }
        }
    },

    _moveBack: function()
    {
        this._loadPage(this._lastPage);
    },

    _hasItem: function(action)
    {
        var id = action.haveItem;
        var qty = action.minimum;
        var hasItem = this._profile.hasPackItem(id, qty);
        var actions = (hasItem === true) ? action.passActions : action.failActions;
        this._processActions(actions);
    },

    _performTest: function(action)
    {
        var result = this._profile.doTest(action.test);
        var actions = (result.pass === true) ? action.passActions : action.failActions;
        this._appendOutput(result.message);
        this._processActions(actions);
    },

    _delayedActions: function(action)
    {
        var milliseconds = action.delay * 1000;
        var processFunc = $.proxy(this._processActions, this, action.actions);
        setTimeout(processFunc, milliseconds);
    },

    _modifyPageData: function (modifiers)
    {
        //no point modifying pageData actions, they have already occurred
        if (modifiers.exits)
        {
            this._pageData.exits = modifiers.exits;
        }
        if (modifiers.addExits)
        {
            for (var i = 0; i < modifiers.addExits.length; i++)
            {
                this._pageData.exits.push(modifiers.addExits[i]);
            }
        }
        if (modifiers.inputs)
        {
            this._pageData.inputs = modifiers.inputs;
        }
        if (modifiers.addInputs)
        {
            for (var i = 0; i < modifiers.addInputs.length; i++)
            {
                this._pageData.inputs.push(modifiers.addInputs[i]);
            }
        }
        if (modifiers.items)
        {
            this._pageData.items = modifiers.items;
        }
        if (modifiers.addItems)
        {
            for (var i = 0; i < modifiers.addItems.length; i++)
            {
                this._pageData.items.push(modifiers.addItems[i]);
            }
        }
    },

    _display2: function (newText)
    {

        this._appendOutput(newText);
        var scrollTime = newText.length * 5;
        var newScrollTop = $(this._output)[0].scrollHeight;

        $(this._input).prop('disabled', true);

        var animateDoneFunc = $.proxy(this._displayScrollDone, this);
        $(this._output).animate({ scrollTop: newScrollTop }, scrollTime, animateDoneFunc);
    },

    _display: function (newText)
    {
        this._appendOutput(newText);
        var newScrollTop = $(this._output)[0].scrollHeight;
        $(this._output).prop("scrollTop", newScrollTop);
    },

    _appendOutput: function (newText)
    {
        var text = $(this._output).html();
        newText = newText.replace(/\r\n/g, "<br/>");
        $(this._output).html(text + newText + "<br/>" + "<br/>");
    },

    _displayScrollDone: function ()
    {
        $(this._input).prop('disabled', false);
        $(this._input).focus();
    },

    _onInputKeyUp: function (evt)
    {
        if (evt.keyCode == 13)
        {
            this._processInput();
        }
    },

    _processInput: function ()
    {
        var inputStr = $(this._input).val();
        $(this._input).val("");
        var parts = inputStr.split(" ");
        var command = parts[0].toLowerCase();

        if (this._isExitShorthand(command) === true)
        {
            command = "go";
            parts.unshift(command);
        }

        this._appendOutput("<i>" + parts.join(" ") + "</i>");

        if (this._isSubCommand(command) === true)
        {
            command = "subcommand";
            parts.unshift(command);
        }

        switch (command)
        {
            case "help":
                this._showHelp();
                break;
            case "exits":
                this._showExits();
                break;
            case "pack":
                this._showPack();
                break;
            case "go":
                this._doGo(parts);
                break;
            case "subcommand":
                this._doSubcommand(parts)
                break;
            case "l":
                this._loadPage(parts[1]);
                break;
            case "":
                //do nothing
                break;
            default:
                this._processUnknownCommand(command);
        }
    },

    _isExitShorthand: function (command)
    {
        var ret = false;
        if (this._SHORT_EXIT_NAMES[command] != null || this._LONG_EXIT_NAMES[command] != null)
        {
            ret = true;
        }
        return ret;
    },

    _isSubCommand: function (command)
    {
        var ret = false;
        if (this._pageData.inputs)
        {
            for (var i = 0; i < this._pageData.inputs.length; i++)
            {
                var cmdItem = this._pageData.inputs[i];
                if (cmdItem.input == command)
                {
                    ret = true;
                    break;
                }
            }
        }
        return ret;
    },

    _showHelp: function ()
    {
        var commands = ["help", "exits", "pack", "go"];

        if (this._pageData.inputs)
        {
            for (var i = 0; i < this._pageData.inputs.length; i++)
            {
                var cmdItem = this._pageData.inputs[i];
                commands.push(cmdItem.input);
            }
        }

        this._display("Available commands:\r\n" + commands.join(", "));
    },

    _showExits: function ()
    {
        var exits = [];
        if (this._pageData.exits)
        {
            for (var i = 0; i < this._pageData.exits.length; i++)
            {
                var exitItem = this._pageData.exits[i];
                var description = this._LONG_EXIT_NAMES[exitItem.dir];
                description += " (" + exitItem.dir + ")"
                exits.push(description);
            }
        }
        else
        {
            exits.push("none");
        }

        var strExits = exits.join(", ");

        this._display("Available exits:\r\n" + strExits);
    },

    _showPack: function ()
    {
        var contents = this._profile.getPackContents();

        if (contents.length == 0)
        {
            this._display("Your backpack is empty");
        }
        else
        {
            this._display("Backpack contents: \r\n" + contents);
        }
    },

    _processUnknownCommand: function (command)
    {
        this._display("I don't know what '" + command + "' means");
    },

    _doGo: function (commandParts)
    {
        var dir = commandParts[1];
        if (dir)
        {
            if (this._SHORT_EXIT_NAMES[dir])
            {
                dir = this._SHORT_EXIT_NAMES[dir];
            }

            var availableExit = null;
            if (this._pageData.exits)
            {
                for (var i = 0 ; i < this._pageData.exits.length; i++)
                {
                    if (this._pageData.exits[i].dir == dir)
                    {
                        availableExit = this._pageData.exits[i];
                        break;
                    }
                }
            }

            if (availableExit)
            {
                var description = this._LONG_EXIT_NAMES[dir];
                this._display("Going " + description);
                if (availableExit.actions)
                {
                    this._processActions(availableExit.actions);

                }
            }
            else
            {
                this._display("You can't go in that direction");
            }
        }
        else
        {
            this._display("In what direction?");
        }
    },

    _doSubcommand: function (parts)
    {

        var subCommand = parts[1];
        var foundCommand = null;
        var ret = false;
        if (this._pageData.inputs)
        {
            for (var i = 0; i < this._pageData.inputs.length; i++)
            {
                var cmdItem = this._pageData.inputs[i];
                if (cmdItem.input == subCommand)
                {
                    foundCommand = cmdItem;
                }
            }
        }

        if (foundCommand == null)
        {
            this._processUnknownCommand(subCommand);
        }
        else
        {
            this._processActions(foundCommand.actions);
        }

    }

});
