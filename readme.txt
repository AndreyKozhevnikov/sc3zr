Tasks:
0. Determine a doc page title by its url (http://code.tutsplus.com/tutorials/web-scraping-with-node-js--net-25560). 
   If this information is not constant, store it in the database.
1. Url must be a valid url;
2. http or https should refer to the same record;
3. rank cannot be negative;
4. rank is incremented every time a record is accessed.
5. title should be re-read when (updatedOn - createdOn) > 30 days. In this case createdOn = updatedOn.
6. 