/** Dual-session module **/

__sco.dualsession.config = {
    status1: ['STATUSONE'],
    status3: ['STATUSTHREE']
};

__sco.dualsession.statusone = function () {

    try {
        __scd.b.v = _scs('#subtotal', '0 totalprice', ['text']); //Set the total value
        /*__scd.s.example = "";*/ // Example session field
    }
    catch (be2) {
        be2.description = "201.2 " + (be2.description || "");
        __sco.error(be2);
    }
    try {
        /* Set rows here **/
        __sco.each(_scs('#cart tr', '1 rows'), function (ix, val) {
            var src = "(http://|https://)", href = "(http://|https://)";
            // Set basket values here
            __scd.b.i.push({
                'n': _scs([val, ".itemname"], '2 itemname', ["text"]),
                'i': _scs([val, ".itemid"], "3 itemid", ["text"]),
                'q': _scs([val, "input.qty"], "4 itemqty", ["getvt"]),
                'v': _scs([val, ".itemprice"], "5 itemprice", ["text", "pricecurr"]),
                'f1': __sco.clear(__sco.attr(_scs([val, 'a:first'], '6 link'), "href"), href, "g"),
                'u': __sco.clear(__sco.attr(_scs([val, 'img:first'], '7 image'), "src"), src, "g")
            });
        });
    }
    catch (be1) {
        be1.description = "101.2 " + (be1.description || "");
        __sco.error(be1);
    }

}

__sco.dualsession.statusthree = function () {
    try {
        // Get the order number and so on here
        // The order number must be in the session field __scd.s.ordernumber and also __scd.o for V2 clients
        //__scd.s.ordernumber = "ordernumber";
    }
    catch (s3) {
        s3.description = "3000 " + (s3.description || "");
        __sco.error(s3);
    }
}

__sco.dualsession.setsessiontransitiontrigger = function () {
    // initiates 2nd session when 1st session is fully sent and closed off
    function startsecondstage() {
        __sco.management.interget("__sc", __sco.management.setsession, false);
    }

    // rerun main to close off first session
    __sco.management.main();
    if (typeof __sco.mainmonitor === "undefined") {
        __sco.dualsession.transitionmonitor = new __sco.monitor();
        __sco.dualsession.transitionmonitor.compare = function () { return __sco.s3sent; }
        __sco.dualsession.transitionmonitor.action = startsecondstage;
        __sco.dualsession.transitionmonitor.startstate = false;
        __sco.dualsession.transitionmonitor.start();
    }

}

/** MODS TO MAIN CONSUMER SCRIPT  **/
/** Pre-run the script to set the status **/
__sco.management.prerun = function () {
    try {
        var status = false, executed = false, empty = false;

        // If we're using Geo IP, then set the flag
        if (__sco.config.geoip)
            __scd.s.geo = true;

        if (__sco.config.dualsession && (status = __sco.management.isstatus(__sco.dualsession.config.status3)) > 0 || __sco.management.isstatus(__sco.dualsession.config.status3)) {
            executed = true;
            // Get the order number
            __sco.dualsession.status3();
            __sco.management.itemtypes();

            status = __sco.tonumber(status);

            if (status && status >= 300 && status < 400) {
                __sco.management.setstatus(status, __sco.management.run);
                __sco.dualsession.setsessiontransitiontrigger(); 
                __sco.management.setstatus(300, __sco.management.run);
            }

            else
                __sco.management.setstatus(300, __sco.management.run);

        }
            // Detect the status and act appropriately (if our status three has already been triggered, don't do it again )
        else if ((status = __sco.management.isstatus(__sco.config.status3)) > 0 || __sco.management.isstatus(__sco.config.status3)) {
            executed = true;
            // Get the order number
            __sco.scraper.statusthree();
            __sco.management.itemtypes();

            status = __sco.tonumber(status);

            if (status && status >= 300 && status < 400)
                __sco.management.setstatus(status, __sco.management.run);
            else
                __sco.management.setstatus(300, __sco.management.run);

        }
        else if ((status = __sco.management.killit()) > 0 || __sco.management.killit()) {
            executed = true;
            // Get any status 4 info
            __sco.scraper.statusfour();
            status = __sco.tonumber(status);
            if (status && status >= 400 && status < 500)
                __sco.management.setstatus(status, __sco.management.run);
            else
                __sco.management.setstatus(400, __sco.management.run);
        }
        else if (__sco.config.dualsession && (status = __sco.management.isstatus(__sco.dualsession.config.status1)) > 0 || __sco.management.isstatus(__sco.dualsession.config.status1)) {
            executed = true;
            // Create a copy of the basket, so if basket is emptied we maintain the last one
            __sco.lastbasket = __sco.clone(__scd.b), customer = "";
            // Clear the old items, if re-run it would add the items otherwise
            __scd.b = __sco.clone(__sco.config.doc.b);
            __sco.dualsession.statusone();

            // If the basket was empty, is still empty and the status is 100 then clear
            if (__sco.lastbasket.i.length == 0 && __scd.b.i.length == 0 && __scd.t < 200)
                empty = true;
                // If the basket was not empty, but now is then keep the old basket
            else if (__sco.lastbasket.i.length > 0 && __scd.b.i.length == 0)
                __scd.b = __sco.clone(__sco.lastbasket);
            // Set the data types for the JSON schema (prices to strings and quantities to ints)
            __sco.management.itemtypes();

            // If this is a migration then look for customer details in the old cookie
            if (__sco.config.migrationcollect && __sco.config.persistcustomer && isFinite(new Date(__sco.config.startdate).getTime()) && new Date().getTime() - new Date(__sco.config.startdate) < (__sco.config.daystorun * 60 * 60 * 24 * 1000) && (customer = __sco.storage.get("__sc"))) {
                if (__sco.type(customer) == "string") {
                    __scd.c.e = __scd.c.e == "" && customer.split(":").length > 1 ? customer.split(":")[1] : __scd.c.e;
                    __scd.c.p.l = __scd.c.p.l == "" && customer.split(":").length > 2 ? customer.split(":")[2] : __scd.c.p.l;
                    var names = customer.split(":").length > 0 && customer.split(":")[0].split("|").length > 0 ? customer.split(":")[0].split("|") : [];
                    __scd.c.f = names.length > 0 && __scd.c.f == "" ? names[0] : __scd.c.f;
                    __scd.c.l = names.length > 1 && __scd.c.l == "" ? names[1] : __scd.c.l;
                }
            }

            if (!empty) {
                status = __sco.tonumber(status);
                if (status && status >= 100 && status < 200)
                    __sco.management.setstatus(status, __sco.management.run);
                else
                    __sco.management.setstatus(100, __sco.management.run);
            }
            else {
                __sco.management.run();
            }

        }
        else if ((status = __sco.management.isstatus(__sco.config.status1)) > 0 || __sco.management.isstatus(__sco.config.status1)) {
            executed = true;
            // Create a copy of the basket, so if basket is emptied we maintain the last one
            __sco.lastbasket = __sco.clone(__scd.b), customer = "";
            // Clear the old items, if re-run it would add the items otherwise
            __scd.b = __sco.clone(__sco.config.doc.b);
            __sco.scraper.statusone();

            // If the basket was empty, is still empty and the status is 100 then clear
            if (__sco.lastbasket.i.length == 0 && __scd.b.i.length == 0 && __scd.t < 200)
                empty = true;
                // If the basket was not empty, but now is then keep the old basket
            else if (__sco.lastbasket.i.length > 0 && __scd.b.i.length == 0)
                __scd.b = __sco.clone(__sco.lastbasket);
            // Set the data types for the JSON schema (prices to strings and quantities to ints)
            __sco.management.itemtypes();

            // If this is a migration then look for customer details in the old cookie
            if (__sco.config.migrationcollect && __sco.config.persistcustomer && isFinite(new Date(__sco.config.startdate).getTime()) && new Date().getTime() - new Date(__sco.config.startdate) < (__sco.config.daystorun * 60 * 60 * 24 * 1000) && (customer = __sco.storage.get("__sc"))) {
                if (__sco.type(customer) == "string") {
                    __scd.c.e = __scd.c.e == "" && customer.split(":").length > 1 ? customer.split(":")[1] : __scd.c.e;
                    __scd.c.p.l = __scd.c.p.l == "" && customer.split(":").length > 2 ? customer.split(":")[2] : __scd.c.p.l;
                    var names = customer.split(":").length > 0 && customer.split(":")[0].split("|").length > 0 ? customer.split(":")[0].split("|") : [];
                    __scd.c.f = names.length > 0 && __scd.c.f == "" ? names[0] : __scd.c.f;
                    __scd.c.l = names.length > 1 && __scd.c.l == "" ? names[1] : __scd.c.l;
                }
            }

            if (!empty) {
                status = __sco.tonumber(status);
                if (status && status >= 100 && status < 200)
                    __sco.management.setstatus(status, __sco.management.run);
                else
                    __sco.management.setstatus(100, __sco.management.run);
            }
            else {
                __sco.management.run();
            }


        }
        else if ((status = __sco.management.isstatus(__sco.config.status2)) > 0 || __sco.management.isstatus(__sco.config.status2) || (__sco.type(__scd.c.e) == "string" && __scd.c.e != "")) {
            executed = true;
            __sco.scraper.statustwo();
            status = __sco.tonumber(status);
            if (status && status >= 200 && status < 300)
                __sco.management.setstatus(status, __sco.management.run);
            else
                __sco.management.setstatus(200, __sco.management.run);
        }

        if (!executed)
            __sco.management.run();
    }
    catch (pre) {
        pre.title = "PRERUNTIME__";
        // Runtime error, report it back
        if (__sco.config.v1)
            __sco.sender.send("POST", __sco.config.errorapi, __sco.v1runtime(pre));
    }
}