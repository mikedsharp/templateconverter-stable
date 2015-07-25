{
    "placeholders": [
        {
            "name": "[[totalprice]]",
            "scope": "item",
            "razor": "item_totalprice",
            "code": "var item_totalpricedouble = 0.00; item_totalpricedouble = @product.Price * @product.Quantity; var item_totalprice = Math.Round(item_totalpricedouble, 2).ToString(\"0.00\");"
        },
        {
            "name": "[[webview]]",
            "scope": "none",
            "legacy": true
        },
        {
            "name": "[[unsubscribe]]",
            "scope": "none",
            "legacy": true
        },
        {
            "name": "[[customername]]",
            "scope": "session",
            "razor": "salutation",
            "code": "var salutation = \"Customer\"; if(Model.Customer != null && string.IsNullOrEmpty(Model.Customer.FirstName) == false) { salutation = String.Format(\"{0},\", Model.Customer.FirstName); }"
        },
        {
            "name": "[[totalvalue]]",
            "scope": "session",
            "code": "var session_totalvaluedouble = 0.00; session_totalvaluedouble = @Model.BasketValue; var session_totalvalue = Math.Round(session_totalvaluedouble, 2).ToString(\"0.00\");", 
            "razor": "session_totalvalue"

        },
        {
            "name": "[[itemimage]]",
            "scope": "item",
            "razor": "product.ImageUrl", 
            "prepend": { "id" : "imageReplaceUrl", "value" : "value" }

        },
        {
            "name": "[[itemname]]",
            "scope": "item",
            "razor": "product.Name"

        },
         {
             "name": "[[itemvalue]]",
             "scope": "item",
             "razor": "item_price",
             "code": "var item_pricedouble = 0.00; item_pricedouble = @product.Price; var item_price = Math.Round(item_pricedouble, 2).ToString(\"0.00\");"

         },
         {
             "name": "[[itemquantity]]",
             "scope": "item",
             "razor": "product.Quantity"

         },
          {
              "name": "[[itemquantity1]]",
              "scope": "item",
              "razor": "product.Quantity"

          },
          {
              "name": "[[itemcurrency]]",
              "scope": "session",
              "razor": "session_cur",
              "code": "var session_cur = @RenderCurrencySymbol();",
              "comment": "this is the apparent standard placeholder for currency, this still needs to be tested and clarified, if all fails, use session:cur and add it manually"
          },
          {
                "name": "[[currencysymbol]]",
                "scope": "session",
                "razor": "session_cur",
                "code": "var session_cur = @RenderCurrencySymbol();",
                "comment": "this is the apparent standard placeholder for currency, this still needs to be tested and clarified, if all fails, use session:cur and add it manually"
          },
          {
              "name": "[[customfield1]]",
              "scope": "item",
              "razor": "customfield1",
              "code": "var customfield1 = @TryGetItemField(@product, \"f1\");"

          },
           {
               "name": "[[numitems]]",
               "scope": "session", 
               "code": "var numitems = String.Format(\"{0}\", Model.Products.Sum(p => p.Quantity));",
               "razor": "numitems"
           }, 
           {
               "name": "[[customeremail]]", 
               "scope": "session", 
               "code": "var email = @Model.Customer.Email;",
               "razor": "email"
           }, 
           {
               "name": "[[itemid]]", 
               "scope": "item", 
               "code": "var itemid = @product.ProductId;",
               "razor": "itemid"
           },
           {
               "name": "[[numberofadults]]", 
               "scope": "item", 
               "code": "var item_na = @TryGetItemField(@product, \"na\");", 
               "razor": "item_na"
           }


    ]
}