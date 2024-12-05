(function(){
    main = {};
    
    if (typeof globalConfig === "undefined") {
        globalConfig = {};
    }
    if (typeof globalConfig.currentVisualizationSpec === "undefined") {
        // globalConfig.currentVisualizationSpec = null; // Initialize as null
        globalConfig.currentVisualizationSpec = {
            mark: "bar",
            encoding: {
                x: { field: "Category", type: "nominal" },
                y: { field: "Value", type: "quantitative" }
            },
            // data: { url: "path/to/data.csv" }
        };
        
    }
    
    vegaOptMode = {
        "actions": false,
        "renderer": "svg",
        "hover": true,
        "tooltip": true
    };

    // Flush All Conversations
    main.flushAllConversations = function(){
        $.post("/delete_dialogs", {})
            .done(function (response) {
                // Not sure what to do with it, yet.
                console.log(response);
            });
    };

    // Flush Specific Conversation
    main.flushConversation = function(dialog_id, query_id){
        $.post("/delete_dialogs", {query_id: query_id, dialog_id: dialog_id})
            .done(function (response) {
                // Not sure what to do with it, yet.
                console.log(response);
            });
    };

    // Dataset is optional here
    main.initializeNL4DV= function(dataset){
        $.post("/init", {"dependency_parser": "spacy"})
            .done(function (response) {
                main.configureDatabase(dataset);
            });
    };

    main.configureDatabase = function(dataset){
        $.post("/setData", {"dataset": dataset})
            .done(function (r1) {
                var attributeTypeChanges = {};
                var ignore_words = [];
                if(dataset === "cars-w-year.csv"){
                    attributeTypeChanges = {
                        "Year": "T"
                    };
                    ignore_words = ['car'];
                }else if(dataset === "cars.csv"){
                    ignore_words = ['car'];
                }else if(dataset === "movies-w-year.csv"){
                    attributeTypeChanges = {
                        "Release Year": "T"
                    };
                    ignore_words = ['movie','movies'];
                }else if(dataset === "housing.csv"){
                    attributeTypeChanges = {
                        "Year": "T"
                    };
                    ignore_words = [];
                }else if(dataset === "olympic_medals.csv"){
                    attributeTypeChanges = {
                        "Gold Medal": 'Q',
                        "Silver Medal": 'Q',
                        "Bronze Medal": 'Q',
                        "Total Medal": 'Q',
                        "Year": "T"
                    };
                    ignore_words = [];
                }

                if(attributeTypeChanges !== {}){
                    $.post("/setAttributeDataType", {"attr_type_obj": JSON.stringify(attributeTypeChanges)})
                        .done(function (r2) {
                            processData(r1, dataset);
                        });
                }

                if(ignore_words.length > 0){
                    $.post("/setIgnoreList", {"ignore_words": JSON.stringify(ignore_words)})
                        .done(function (r3) {
                        });
                }

                if(attributeTypeChanges === {} && ignore_words.length === 0){
                    processData(r1, dataset);
                }

            });
    };

    function processData(nl4dvMetadataMap, dataset){
        // console.log(nl4dvMetadataMap);
        globalConfig.metadataMap = {};
        globalConfig.dataList = [];
        for(let attr in nl4dvMetadataMap['summary']){
            globalConfig.metadataMap[attr] = {
                "type" : ""
            };
            if(nl4dvMetadataMap['summary'][attr]['dataType']==="Q"){
                globalConfig.metadataMap[attr]['type'] = "numeric";
            }else { // for this example, all non-quantitative/numeric attributes are treated as categorical
                globalConfig.metadataMap[attr]['type'] = "categorical";
            }

            if(nl4dvMetadataMap['summary'][attr]['isLabelAttribute']){
                globalConfig.labelAttr = attr;
                globalConfig.metadataMap[attr]['isLabelAttr'] = true;
            }
        }
    }

    // main.analyzeQuery = function(query){
    //     $.post("/analyze_query", {"query": query})
    //         .done(function (response_string) {
    //             let nl4dvResponse = JSON.parse(response_string);
    //             console.log(nl4dvResponse);
    //             let visList = nl4dvResponse['visList'];
    //             if(visList.length>0){
    //                 let newVisSpec = visList[0]['vlSpec'];
    //             }
    //         });
    // };

    // New analyzeQuery function 
    main.analyzeQuery = function(query){
        $.post("/analyze_queryy", {"query": query})
            .done(function (response_string) {
                let nl4dvResponse = JSON.parse(response_string);
                console.log("Analyze Query Response:", nl4dvResponse);
    
                let visList = nl4dvResponse['visList'];
                if (visList.length > 0) {
                    let newVisSpec = visList[0]['vlSpec'];
                    console.log("New Visualization Spec:", newVisSpec);
    
                    // Save the visualization spec globally
                    globalConfig.currentVisualizationSpec = newVisSpec;
                    console.log("Updated globalConfig.currentVisualizationSpec:", globalConfig.currentVisualizationSpec);
    
                    // Optionally, render the new visualization
                    vegaEmbed("#visualization-container", newVisSpec);
                } else {
                    console.warn("No visualizations returned from analyze_query.");
                }
            })
            .fail(function (error) {
                console.error("Error analyzing query:", error);
            });
    };
    
    
    

    // Call Draco Function
        // Call Draco Function - v1
    // main.callDraco = function () {
    //     // Assuming currentSpec is globally available or can be passed in
    //     const currentSpec = globalConfig.currentVisualizationSpec; // Adjust this to access the current Vega-Lite spec
    
    //     // Make an AJAX POST request to the Flask backend
    //     $.post("/generate_alternatives", {"vl_spec": JSON.stringify(currentSpec)})
    //         .done(function (response) {
    //             const alternatives = JSON.parse(response).alternatives;
    
    //             // Render alternatives
    //             renderAlternatives(alternatives);
    //         })
    //         .fail(function (error) {
    //             console.error("Error calling Draco:", error);
    //         });
    // };
 
    //    // Call Draco Function - v2
    // main.callDraco = function () {
    //     console.log("Draco button clicked!");
    
    //     // Ensure the current visualization spec is accessible
    //     const currentSpec = globalConfig.currentVisualizationSpec; // Ensure this variable is correctly initialized
    //     if (!currentSpec) {
    //         console.error("No current visualization spec found!");
    //         return;
    //     }
    
    //     console.log("Current Spec:", currentSpec);
    
    //     // Make an AJAX POST request to the Flask backend
    //     $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
    //         .done(function (response) {
    //             console.log("Draco Response:", response);
    
    //             // Parse and render alternatives
    //             const alternatives = response.alternatives || [];
    //             if (alternatives.length === 0) {
    //                 console.warn("No alternatives generated.");
    //                 return;
    //             }
    
    //             renderAlternatives(alternatives);
    //         })
    //         .fail(function (error) {
    //             console.error("Error calling Draco:", error);
    //         });
    // };

    // Call Draco Function - v3
    main.callDraco = function () {
        console.log("Draco button clicked!");
    
        // Assuming currentSpec is defined in globalConfig
        const currentSpec = globalConfig.currentVisualizationSpec;
        console.log("globalConfig.currentVisualizationSpec:", globalConfig.currentVisualizationSpec);

        if (!currentSpec) {
            console.error("No current visualization spec found! Please create or load a visualization before generating alternatives.");
            return;
        }
    
        console.log("Current Spec:", currentSpec);
    
        // Make an AJAX POST request to the Flask backend
        $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
            .done(function (response) {
                console.log("Draco Response:", response);
                const alternatives = response.alternatives || [];
                renderAlternatives(alternatives);
            })
            .fail(function (error) {
                console.error("Error calling Draco:", error);
            });
    };
    
    
    // Helper function to render alternative visualizations
    function renderAlternatives(alternatives) {
        const container = document.getElementById("alternatives-container");
        container.innerHTML = ''; // Clear previous alternatives
    
        alternatives.forEach((alt, index) => {
            const div = document.createElement('div');
            div.id = `alt-vis-${index}`;
            div.style.marginBottom = '20px';
    
            const title = document.createElement('h3');
            title.textContent = `Alternative ${index + 1}`;
            div.appendChild(title);
    
            container.appendChild(div);
    
            // Render the Vega-Lite visualization
            vegaEmbed(`#alt-vis-${index}`, alt.vl_spec);
        });
    }
    

    // $("#datasetSelect").change(function () {
    //     let dataset = $(this).val();
    //     main.initializeNL4DV(dataset);
    //     main.flushAllConversations();

    //     let data = JSON.parse(JSON.stringify(globalConfig.data));
    //     let mindmap = new MindMap("mindmap-svg", data);
    //     mindmap.renderMap();
    // });

    // New datasetSelect change function 
    $("#datasetSelect").change(function () {
        let dataset = $(this).val();
        main.initializeNL4DV(dataset);
        main.flushAllConversations();
    
        // // Reset visualization spec
        globalConfig.currentVisualizationSpec = null; 
        // console.log("Visualization spec reset due to dataset change.");
    
        // Safeguard against undefined globalConfig.data
        if (!globalConfig.data) {
            console.error("No data available in globalConfig. Cannot render mindmap.");
            return;
        }
    
        let data = JSON.parse(JSON.stringify(globalConfig.data));
        let mindmap = new MindMap("mindmap-svg", data);
        mindmap.renderMap();
    });
    
    

    // function init() {
    //     $("#datasetSelect").val("euro.csv").trigger("change");
    // }
    // init();

    // New init function
    function init() {
        let defaultDataset = "euro.csv"; // Replace with your default dataset name
        $("#datasetSelect").val(defaultDataset).trigger("change");
    }
    init();
    

})();
window.main = main;