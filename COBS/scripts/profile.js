
var Profile = $.klass
({
    EoStrength: 0,
    EoFate: 0,
    EoCapability: 0,
    EoAgility: 0,

    inventory: null,

    init: function ()
    {
        this.EoStrength = 12 + this.rollDice(2);
        this.EoFate = 6 + this.rollDice(1);
        this.EoCapability = 6 + this.rollDice(1);
        this.EoAgility = 6 + this.rollDice(2);
        this.inventory = [];

        this.addPackItem("lantern", "Lantern", 1);
        this.addPackItem("sword", "Sword", 1);
        this.addPackItem("gold", "Gold Pieces", 5);
        this.addPackItem("gold", "Gold Pieces", 5);
    },

    doTest: function(test)
    {
        var result = {};
        switch (test)
        {
            case "strength":
                result.message = "Testing your Strength...";
                result.pass = this.testStrength();
                result.message += (result.pass === true) ? "You have the power!" : "You are temporarily weak!";
                break;
            case "fate":
                result.message = "Tempting your Fate...";
                result.pass = this.temptFate();
                result.message += (result.pass === true) ? "You are fortunate!" : "You are unfortunate!";
                break;
            case "ability":
                result.message = "Ascertaining your Ability...";
                result.pass = this.ascertainAbility();
                result.message += (result.pass === true) ? "You are skilful!" : "You are momentarily clumsy!";
                break;
            case "speed":
                result.message = "Striking your Speed...";
                result.pass = this.strikeSpeed();
                result.message += (result.pass === true) ? "You are fast enough!" : "You are not fast enough!";
                break;
            default:
                //unknown test
                debugger;
                break;
        }
        return result;
    },

    testStrength: function ()
    {
        var score = this.rollDice(3);
        var haveThePower = (score <= this.EoStrength) ? true : false;
        return haveThePower;
    },

    temptFate: function ()
    {
        var score = this.rollDice(2);
        var areFortunate = (score <= this.EoFate) ? true : false;
        return areFortunate;
    },

    ascertainAbility: function ()
    {
        var score = this.rollDice(2);
        var areSkilful = (score <= this.EoCapability) ? true : false;
        return areSkilful;
    },

    strikeSpeed: function ()
    {
        var score = this.rollDice(2);
        var areSkilful = (score <= this.EoAgility) ? true : false;
        return areSkilful;
    },

    rollDice: function (numDice)
    {
        var ret = 0;
        for (var i = 0; i < numDice; i++)
        {
            ret += Math.floor((Math.random() * 6) + 1);
        }
        return ret;
    },

    getPackContents: function()
    {
        var ret = [];
        for (var i = 0; i < this.inventory.length; i++)
        {
            var item = this.inventory[i];
            var qty = item.qty;
            if (qty > 0)
            {
                var description = item.description;
                description += " (" + qty + ")";
                ret.push(description);
            }
        }
        return ret.join("\r\n");
    },

    addPackItem: function (id, description, quantity)
    {
        var newItem =
        {
            qty: quantity,
            id: id,
            description: description
        };

        for (var i = 0; i < this.inventory.length; i++)
        {
            var checkItem = this.inventory[i];
            if (checkItem.id == newItem.id)
            {
                checkItem.qty += newItem.qty;
                newItem = null;
                break;
            }
        }

        if (newItem != null)
        {
            this.inventory.push(newItem);
        }

    },

    hasPackItem: function(id, quantity)
    {
        var ret = false;
        for (var i = 0; i < this.inventory.length; i++)
        {
            var checkItem = this.inventory[i];
            if (checkItem.id == id && checkItem.qty >= quantity)
            {
                ret = true;
                break;
            }
        }
        return ret;
    },

    adjustStats: function (profileAdjustment)
    {
        if (profileAdjustment.eos)
        {
            this.EoStrength += profileAdjustment.eos;
        }
        if (profileAdjustment.eoc)
        {
            this.EoCapability += profileAdjustment.eoc;
        }
        if (profileAdjustment.eof)
        {
            this.EoFate += profileAdjustment.eof;
        }
        if (profileAdjustment.eoa)
        {
            this.EoAgility += profileAdjustment.eoa;
        }
    }

});


