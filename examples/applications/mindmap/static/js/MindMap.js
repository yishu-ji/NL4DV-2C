 function MindMap(svgID, data) {

     this.nodes = data.nodes;
     this.currentTargetElement = null;
     this.nodes[0]["fx"] = window.innerWidth / 2;
     this.nodes[0]["fy"] = (window.innerHeight - 250) / 2;

     // Empty the DOM element
     d3.selectAll("#" + svgID + " > *").remove();

     this.connections = data.connections;
     this.svg = document.getElementById(svgID);

     this.editable = true;
     this.simulation = null;
    //  let firstTime = true;
     let parent = this;

     // methods
     var prepareNodes = function () {
         const render = (node) => {
             node.uid = uuid.v4();
             node.html = nodeTemplate(node);

             const dimensions = getDimensions(node.html, {}, "mindmap-node");
             node.width = dimensions.width;
             node.height = dimensions.height;
         };

         parent.nodes.forEach((node, i) => render(node, i));
    }

     /**
      * Add new class to nodes, attach drag behavior,
      * and start simulation.
      */
     parent.prepareEditor = function (svg, conns, nodes) {
         nodes
             .attr("class", "mindmap-node mindmap-node--editable")
             .attr("id", d => d.uid)
             .on("dbclick", node => {
                 node.fx = null;
                 node.fy = null;
             })
             .on("click", (d, i) => {
                 parent.nodeClickEvent(d3NodeClick(d, i), d);
             });

         nodes.call(d3Drag(parent.simulation, svg, nodes));

         // Tick the simulation 100 times
         for (let i = 0; i < 100; i += 1) {
             parent.simulation.tick();
         }

         setTimeout(() => {
             parent.simulation.alphaTarget(0.5).on("tick", () => onTick(conns, nodes));
         }, 200);
     }

     /**
      * Render mind map unsing D3
      */
     parent.renderMap = function () {

         // Create force simulation to position nodes that have
         // no coordinate, and add it to the component state
         parent.simulation = d3.forceSimulation()
             .force("link", d3.forceLink().id(node => node.id))
             .force("charge", d3.forceManyBody())
             .force("collide", d3.forceCollide().radius(200))

         const svg = d3.select(parent.svg);

         // Clear the SVG in case there's stuff already there.
         svg.selectAll("*").remove();

         // Add subnode group
         svg.append("g").attr("id", "mindmap-subnodes");

         prepareNodes();

         // Bind data to SVG elements and set all the properties to render them
         const connections = d3Connections(svg, parent.connections);
         const {
             nodes
         } = d3Nodes(svg, parent.nodes);

         parent.nodes.forEach(node => {
            if("vlSpec" in node && node["vlSpec"] != null){
                vegaEmbed(document.getElementById("visContainer-" + node.id), node.vlSpec, vegaOptMode);
            }
         });
         nodes.append("title").text(node => node.uid);

         // Bind nodes and connections to the simulation
         parent.simulation
             .nodes(parent.nodes)
             .force("link")
             .links(parent.connections);

         if (parent.editable) {
             parent.prepareEditor(svg, connections, nodes);
         }

         // Tick the simulation 100 times
         for (let i = 0; i < 100; i += 1) {
             parent.simulation.tick();
         }
         onTick(connections, nodes);

        //  if (firstTime) { // Call it only once when the app loads; let the user take over thereafter!
        //      svg
        //          // .attr("viewBox", getViewBox(nodes.data())) // Keep this commented to avoid centering the nodes and losing their manual positioning.
        //          .call(d3PanZoom(svg))
        //          .on("dbClick.zoom", null);

        //      firstTime = false;
        //  }

     }

     /**
      * node mouse click events
      */
     parent.nodeClickEvent = function (event, node) {
         switch (event) {
             case "add":
                 parent.addNewNode(node);
                 break;
             case "remove":
                 parent.removeNode(node);
                 break;
             case "click":
                 parent.clickNode(node);
                 break;
         }
     }

     /**
      * click on node text
      */
     parent.clickNode = function (d) {
         console.log("node clicked: " + d.text);
     }

    // $("#processQueryBtn").click(function(){
    //     let newQuery = $("#queryBox").val();
    //     if(!newQuery || newQuery.trim().length === 0){
    //         console.log("Your query is incorrect/incomplete.");
    //     }else{
    //         $('#queryModal').modal('hide');
    //         let target = parent.currentTargetElement;
    //         let dialog = target.id != "ROOT"; // If clicked node is not the root, then it is a follow-up query!
    //          $.post("/analyze_query", {
    //                  "query": newQuery,
    //                  "dialog": dialog,
    //                  "dialog_id": target.dialog_id,
    //                  "query_id": target.query_id
    //              })
    //              .done(function (response_string) {

    //                  var response = JSON.parse(response_string);
    //                  for (var i = 0; i < response['visList'].length; i++) {
    //                      var obj = response['visList'][0];
    //                      if (JSON.stringify(obj['encoding']) != "{}") {


    //                             obj["vlSpec"]['width'] = globalConfig.vegaMainChartSize.width;
    //                             obj["vlSpec"]['height'] = globalConfig.vegaMainChartSize.height;

    //                             const nodeId = uuid.v4();
    //                             parent.nodes.push({
    //                                 id: nodeId,
    //                                 text: newQuery,
    //                                 fx: target.fx,
    //                                 fy: target.fy + 150,
    //                                 vlSpec: obj["vlSpec"],
    //                                 dialog_id: response["dialogId"],
    //                                 query_id: response["queryId"]
    //                             });
    //                             parent.connections.push({
    //                                 source: target.id,
    //                                 target: nodeId
    //                             });
    //                             parent.renderMap();

    //                          // container for Vis
    //                          vegaEmbed(document.getElementById("visContainer-" + nodeId), obj["vlSpec"], vegaOptMode);
    //                      }
    //                      // Just take the first, best visualization!
    //                      break;
    //                  }

    //              });
    //     }
    // });

    // // New click function 
    // $("#processQueryBtn").click(function(){
    //     let newQuery = $("#queryBox").val();
    //     if (!newQuery || newQuery.trim().length === 0) {
    //         console.log("Your query is incorrect/incomplete.");
    //     } else {
    //         $('#queryModal').modal('hide');
    //         let target = parent.currentTargetElement;
    //         let dialog = target.id != "ROOT"; // Check if it's a follow-up query
    
    //         $.post("/analyze_query", {
    //                 "query": newQuery,
    //                 "dialog": dialog,
    //                 "dialog_id": target.dialog_id,
    //                 "query_id": target.query_id
    //             })
    //             .done(function (response_string) {
    //                 let response = JSON.parse(response_string);
    
    //                 for (let i = 0; i < response['visList'].length; i++) {
    //                     let obj = response['visList'][0];
    
    //                     if (JSON.stringify(obj['encoding']) !== "{}") {
    //                         obj["vlSpec"]['width'] = globalConfig.vegaMainChartSize.width;
    //                         obj["vlSpec"]['height'] = globalConfig.vegaMainChartSize.height;
    
    //                         // Save the generated vlSpec globally
    //                         globalConfig.currentVisualizationSpec = obj["vlSpec"];
    //                         console.log("Updated globalConfig.currentVisualizationSpec:", globalConfig.currentVisualizationSpec);
    //                         // print("Updated globalConfig.currentVisualizationSpec:", globalConfig.currentVisualizationSpec);
    //                         const nodeId = uuid.v4();
    //                         parent.nodes.push({
    //                             id: nodeId,
    //                             text: newQuery,
    //                             fx: target.fx,
    //                             fy: target.fy + 150,
    //                             vlSpec: obj["vlSpec"],
    //                             dialog_id: response["dialogId"],
    //                             query_id: response["queryId"]
    //                         });
    //                         parent.connections.push({
    //                             source: target.id,
    //                             target: nodeId
    //                         });
    //                         parent.renderMap();
    
    //                         // Render visualization
    //                         vegaEmbed(document.getElementById("visContainer-" + nodeId), obj["vlSpec"], vegaOptMode);
    //                     }
    
    //                     // Stop after the first visualization
    //                     break;
    //                 }
    //             });
    //     }
    // });


// // New click function - v1

function preprocessSpec(vlSpec) {
    // Check if the spec has a `data.url`
    if (vlSpec.data && vlSpec.data.url) {
        console.log("Preprocessing vlSpec: Converting data.url to inline data");

        // Make an AJAX call to fetch data as JSON from the backend
        $.ajax({
            url: "/get_csv_data",
            method: "POST",
            async: false, // Synchronous request to ensure data is ready
            data: { url: vlSpec.data.url },
            success: function (csvData) {
                vlSpec.data = { values: csvData };
                console.log("Successfully converted data.url to inline data:", vlSpec.data);
            },
            error: function (error) {
                console.error("Error fetching inline data:", error);
            }
        });
    }
    return vlSpec;
}


$("#processQueryBtn").click(function () {
    let newQuery = $("#queryBox").val();
    if (!newQuery || newQuery.trim().length === 0) {
        console.log("Your query is incorrect/incomplete.");
    } else {
        $('#queryModal').modal('hide');
        let target = parent.currentTargetElement;
        let dialog = target.id !== "ROOT"; // Check if it's a follow-up query

        $.post("/analyze_query", {
            "query": newQuery,
            "dialog": dialog,
            "dialog_id": target.dialog_id,
            "query_id": target.query_id
        })
            .done(function (response_string) {
                let response = JSON.parse(response_string);

                for (let i = 0; i < response['visList'].length; i++) {
                    let obj = response['visList'][0];

                    if (JSON.stringify(obj['encoding']) !== "{}") {
                        obj["vlSpec"]['width'] = globalConfig.vegaMainChartSize.width;
                        obj["vlSpec"]['height'] = globalConfig.vegaMainChartSize.height;

                        // Save the generated vlSpec globally
                        globalConfig.currentVisualizationSpec = preprocessSpec(obj["vlSpec"]);
                        console.log("Updated globalConfig.currentVisualizationSpec after preprocessing:", globalConfig.currentVisualizationSpec);

                        const nodeId = uuid.v4();
                        parent.nodes.push({
                            id: nodeId,
                            text: newQuery,
                            fx: target.fx,
                            fy: target.fy + 150,
                            vlSpec: obj["vlSpec"],
                            dialog_id: response["dialogId"],
                            query_id: response["queryId"]
                        });
                        parent.connections.push({
                            source: target.id,
                            target: nodeId
                        });
                        parent.renderMap();

                        // Render visualization
                        vegaEmbed(document.getElementById("visContainer-" + nodeId), obj["vlSpec"], vegaOptMode);
                    }

                    // Stop after the first visualization
                    break;
                }
            });
    }
});

// // draco
//     // Draco button click function
// $("#generateAlternativesBtn").click(function () {
//     console.log("Draco button clicked!");

//     // Ensure a visualization spec exists
//     const currentSpec = globalConfig.currentVisualizationSpec;
//     if (!currentSpec) {
//         alert("No current visualization spec found! Please create or load a visualization before generating alternatives.");
//         console.error("No current visualization spec found! Cannot generate alternatives.");
//         return;
//     }

//     console.log("Sending current Vega-Lite spec to Flask backend:", currentSpec);

//     // Make AJAX call to the Flask backend to generate alternatives
//     $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
//         .done(function (response) {
//             console.log("Received response from Draco:", response);

//             const alternatives = response.alternatives || [];
//             if (alternatives.length === 0) {
//                 console.warn("Draco generated no alternatives.");
//                 alert("No alternative visualizations could be generated.");
//                 return;
//             }

//             // Render the alternatives
//             renderAlternatives(alternatives);
//         })
//         .fail(function (error) {
//             console.error("Error calling Draco:", error);
//             alert("An error occurred while generating alternatives. Check the console for details.");
//         });
// });

// // Helper function to render the alternative visualizations
// function renderAlternatives(alternatives) {
//     const container = document.getElementById("alternatives-container");
//     container.innerHTML = ""; // Clear previous alternatives

//     alternatives.forEach((alt, index) => {
//         const div = document.createElement("div");
//         div.id = `alt-vis-${index}`;
//         div.style.marginBottom = "20px";

//         const title = document.createElement("h3");
//         title.textContent = `Alternative ${index + 1}`;
//         div.appendChild(title);

//         container.appendChild(div);

//         // Render each Vega-Lite visualization
//         vegaEmbed(`#alt-vis-${index}`, alt.vl_spec);
//     });
// }

// // Draco button click function - v1
// window.callDraco = function () {
//     console.log("Draco button clicked!");

//     // Ensure a visualization spec exists
//     const currentSpec = globalConfig.currentVisualizationSpec;
//     if (!currentSpec) {
//         alert("No current visualization spec found! Please create or load a visualization before generating alternatives.");
//         console.error("No current visualization spec found! Cannot generate alternatives.");
//         return;
//     }

//     console.log("Sending current Vega-Lite spec to Flask backend:", currentSpec);

//     // Make AJAX call to the Flask backend to generate alternatives
//     $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
//         .done(function (response) {
//             console.log("Received response from Draco:", response);

//             const alternatives = response.alternatives || [];
//             if (alternatives.length === 0) {
//                 console.warn("Draco generated no alternatives.");
//                 alert("No alternative visualizations could be generated.");
//                 return;
//             }

//             // Render the alternatives
//             renderAlternatives(alternatives);
//         })
//         .fail(function (error) {
//             console.error("Error calling Draco:", error);
//             alert("An error occurred while generating alternatives. Check the console for details.");
//         });
// };

// // Draco button click function - v2
// window.callDraco = function () {
//     console.log("Draco button clicked!");

//     // Ensure a visualization spec exists
//     const currentSpec = globalConfig.currentVisualizationSpec;
//     if (!currentSpec) {
//         alert("No current visualization spec found! Please create or load a visualization before generating alternatives.");
//         console.error("No current visualization spec found! Cannot generate alternatives.");
//         return;
//     }

//     console.log("Sending current Vega-Lite spec to Flask backend:", currentSpec);

//     // Make AJAX call to the Flask backend to generate alternatives
//     $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
//         .done(function (response) {
//             console.log("Received response from Draco:", response);

//             // Update the global spec with the modified version returned by the backend
//             if (response.updated_vl_spec) {
//                 globalConfig.currentVisualizationSpec = response.updated_vl_spec;
//                 console.log("Updated globalConfig.currentVisualizationSpec:", globalConfig.currentVisualizationSpec);
//             }

//             const alternatives = response.alternatives || [];
//             if (alternatives.length === 0) {
//                 console.warn("Draco generated no alternatives.");
//                 alert("No alternative visualizations could be generated.");
//                 return;
//             }

//             // Render the alternatives
//             renderAlternatives(alternatives);
//         })
//         .fail(function (error) {
//             console.error("Error calling Draco:", error);
//             alert("An error occurred while generating alternatives. Check the console for details.");
//         });
// };

// // Draco button click function - v3
window.callDraco = function () {
    console.log("Draco button clicked!");

    // Ensure a visualization spec exists
    const currentSpec = globalConfig.currentVisualizationSpec;
    if (!currentSpec) {
        alert("No current visualization spec found! Please create or load a visualization before generating alternatives.");
        console.error("No current visualization spec found! Cannot generate alternatives.");
        return;
    }

    console.log("Sending current Vega-Lite spec to Flask backend:", currentSpec);

    // Make AJAX call to the Flask backend to generate alternatives
    $.post("/generate_alternatives", { "vl_spec": JSON.stringify(currentSpec) })
        .done(function (response) {
            console.log("Received response from Draco:", response);
            // Update the global spec with the modified version returned by the backend
            if (response.updated_vl_spec) {
                globalConfig.currentVisualizationSpec = response.updated_vl_spec;
                console.log("Updated globalConfig.currentVisualizationSpec with inline data:", globalConfig.currentVisualizationSpec);
            } else {
                console.warn("No updated_vl_spec found in response.");
            }

            const alternatives = response.alternatives || [];
            if (alternatives.length === 0) {
                console.warn("Draco generated no alternatives.");
                alert("No alternative visualizations could be generated.");
                return;
            }

            // Render the alternatives
            renderAlternatives(alternatives);
        })
        .fail(function (error) {
            console.error("Error calling Draco:", error);
            alert("An error occurred while generating alternatives. Check the console for details.");
        });
};

// copy and view function 
// Function to display Vega-Lite spec in a container
function viewVegaLiteSpec() {
    const currentSpec = globalConfig.currentVisualizationSpec;

    if (!currentSpec) {
        alert("No Vega-Lite specification available to view!");
        console.error("No current visualization spec found.");
        return;
    }
    
    // Clone the spec to avoid modifying the original
    const modifiedSpec = { ...currentSpec };
    delete modifiedSpec["$schema"];
    if (modifiedSpec["mark"] && modifiedSpec["mark"]["tooltip"]) {
        delete modifiedSpec["mark"]["tooltip"];
    }
    console.log("Viewing Vega-Lite Spec:", modifiedSpec); alert(JSON.stringify(modifiedSpec, null, 2)); // Display spec in an alert for debugging purposes
}
window.viewVegaLiteSpec = viewVegaLiteSpec;


function copyVegaLiteSpec() {
    const currentSpec = globalConfig.currentVisualizationSpec;

    if (!currentSpec) {
        alert("No Vega-Lite specification available to copy!");
        console.error("No current visualization spec found.");
        return;
    }

    // Clone the spec to avoid modifying the original
    const modifiedSpec = { ...currentSpec };
    delete modifiedSpec["$schema"];

    const specString = JSON.stringify(modifiedSpec, null, 2);
    navigator.clipboard.writeText(specString).then(() => {
        alert("Vega-Lite specification copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy spec to clipboard:", err);
    });
}
// Expose function globally if needed
window.copyVegaLiteSpec = copyVegaLiteSpec;

// ASP for DRACO
// copy and view function 
// Function to display Vega-Lite spec in a container
// function viewconvertToASP() {
//     const currentSpec = globalConfig.currentVisualizationSpec;

//     if (!currentSpec) {
//         alert("No Vega-Lite specification available to convert!");
//         console.error("No current visualization spec found.");
//         return;
//     }

//     // Send the Vega-Lite spec to the backend
//     $.ajax({
//         url: "/convert_to_asp",
//         method: "POST",
//         contentType: "application/json",
//         data: JSON.stringify({ vl_spec: currentSpec }),
//         success: function (response) {
//             if (response.asp_rules) {
//                 console.log("ASP Rules:", response.asp_rules);
//                 // Display the ASP rules in a modal or alert
//                 alert("ASP Rules:\n" + response.asp_rules);
//             } else {
//                 console.warn("No ASP rules returned from the backend.");
//             }
//         },
//         error: function (error) {
//             console.error("Error converting to ASP:", error);
//             alert("Failed to convert to ASP. Check console for details.");
//         }
//     });
// }
// window.viewconvertToASP = viewconvertToASP;

// function fetchASP(callback) {
//     const currentSpec = globalConfig.currentVisualizationSpec;

//     if (!currentSpec) {
//         alert("No Vega-Lite specification available to convert!");
//         console.error("No current visualization spec found.");
//         return;
//     }

//     // Send the Vega-Lite spec to the backend
//     $.ajax({
//         url: "/convert_to_asp",
//         method: "POST",
//         contentType: "application/json",
//         data: JSON.stringify({ vl_spec: currentSpec }),
//         success: function (response) {
//             if (response.asp_rules) {
//                 callback(response.asp_rules);
//             } else {
//                 console.warn("No ASP rules returned from the backend.");
//             }
//         },
//         error: function (error) {
//             console.error("Error converting to ASP:", error);
//             alert("Failed to convert to ASP. Check console for details.");
//         }
//     });
// }
// function viewASP() {
//     fetchASP(function (aspRules) {
//         console.log("Viewing ASP Rules:", aspRules);
//         alert("ASP Rules:\n" + aspRules);
//     });
// }
// function copyASP() {
//     fetchASP(function (aspRules) {
//         navigator.clipboard.writeText(aspRules)
//             .then(() => {
//                 alert("ASP Rules copied to clipboard!");
//             })
//             .catch(err => {
//                 console.error("Failed to copy ASP rules to clipboard:", err);
//             });
//     });
// }
// // Expose functions globally
// window.viewASP = viewASP;
// window.copyASP = copyASP;

function fetchASP(callback) {
    const currentSpec = globalConfig.currentVisualizationSpec;

    if (!currentSpec) {
        alert("No Vega-Lite specification available to convert!");
        console.error("No current visualization spec found.");
        return;
    }

    // Send the Vega-Lite spec to the backend
    $.ajax({
        url: "/convert_to_asp",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ vl_spec: currentSpec }),
        success: function (response) {
            if (response.asp_rules) {
                callback(response.asp_rules); // Use callback to process ASP rules
            } else {
                console.warn("No ASP rules returned from the backend.");
            }
        },
        error: function (error) {
            console.error("Error converting to ASP:", error);
            alert("Failed to convert to ASP. Check console for details.");
        }
    });
}
function viewASP() {
    fetchASP(function (aspRules) {
        console.log("Viewing ASP Rules:", aspRules);
        // Display the ASP rules in a modal or alert
        alert("ASP Rules:\n" + aspRules);
    });
}
function copyASP() {
    fetchASP(function (aspRules) {
        navigator.clipboard.writeText(aspRules)
            .then(() => {
                alert("ASP Rules copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy ASP rules to clipboard:", err);
            });
    });
}
// Expose functions globally
window.viewASP = viewASP;
window.copyASP = copyASP;


    

     /**
      * add new child nodes
      */
     parent.addNewNode = function (target) {
        console.log(target);
        //  var newQuery = prompt("Enter query", "");
        parent.currentTargetElement = target;
        // $('#queryModal').modal('show');
        $("#queryModal").modal({backdrop: 'static', keyboard: false});
     }
     /**
      * remove a node: not needed for this demo application as it is EDA.
      */
     parent.removeNode = function (target) {
         console.log("request to delete node: " + target.text);
         $.post("/flushConversation", {
            "dialog_id": target.dialog_id,
            "query_id": target.query_id
        })
        .done(function (response) {
            console.log(parent.nodes);
            console.log(parent.connections);
            console.log(response);

         // TODO: Check with Rishab -- this function errs in NL4DV.
         // TODO: Figure out how to actually delete the node (along with all it's children) from the UI.

        });
     }

     /**
      * edit node text
      */
     parent.editNode = function (d) {
         var nodeTitle = prompt("node text", d.text);
         if (nodeTitle != null) {
             d.text = nodeTitle;
             parent.renderMap();
         }
     }

     return {
         renderMap: parent.renderMap
     }
 }
