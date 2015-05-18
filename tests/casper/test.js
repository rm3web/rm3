casper.test.begin('Validate page render', 1, function suite(test) {
    casper.start("http://127.0.0.1:4000/", function() {
        test.assertTitle("Welcome to rm3", "Rendering a page");
    });

    casper.run(function() {
        test.done();
    });
});