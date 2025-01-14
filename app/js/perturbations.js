/*
Metaboverse
Visualizing and Analyzing Metabolic Networks
https://github.com/Metaboverse/Metaboverse/
alias: metaboverse

MIT License

Copyright (c) Jordan A. Berg, The University of Utah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
var sample = 0;
var last_click = 0;
var selection = null;
var superSelection = null;
var selector = "#graph";
var _width = window.innerWidth;
var _height = window.innerHeight - 75;
var database;
var collapsed_global_motifs;
var global_motifs;
var timecourse;
var pathway_dict;
var collapsed_pathway_dict;
var superPathwayDict;
var entity_dictionary;
var motif_outputs;
let data;
let selected_reactions;
graph_genes = true;
collapse_reactions = true;

function add_stat_threshold(stat_type) {
  var perturbation_stat_string = "";
  if (stat_type === "array") {
    perturbation_stat_string = "<br>"
  } else {
    perturbation_stat_string = `
    Stat Threshold:
    <input type="number" name="conn_stat_button" id="conn_stat_button" min="0" max="1.0000000" value="0.00001" />
    <button id="play_button_stat" class="play_button" title="Change value and click to modify the perturbation threshold for a reaction to appear in the window.">
      &#10148;
    </button>
    `
  }
  $('#stat_threshold_space').html(perturbation_stat_string);
}

function collect_perturbations(
  reaction_entity_dictionary,
  mapping_dictionary,
  threshold,
  type,
  sample_indices) {

  let perturbed_reactions = [];
  for (sample in sample_indices) {

    let sample_perturbations = [];
    for (rxn in reaction_entity_dictionary) {

      let perturbed_true = false;
      if (selected_reactions.includes(rxn) === true) {
        for (e in reaction_entity_dictionary[rxn]) {

          let entity = reaction_entity_dictionary[rxn][e];
          if (entity in mapping_dictionary) {
            if (type === "value") {
              if (Math.abs(mapping_dictionary[entity][sample]) >= threshold) {
                perturbed_true = true;
              }
            } else if (type === "stat") {
              if (Math.abs(mapping_dictionary[entity][sample]) <= threshold) {
                perturbed_true = true;
              }
            }
          }
        }
      }
      if (perturbed_true === true) {
        sample_perturbations.push(rxn);
      }
    }
    perturbed_reactions[sample] = sample_perturbations;
  }
  return perturbed_reactions;
}

function show_graph(data, perturbed_rxns, sample_id) {

  console.log("Plotting", perturbed_rxns[sample_id].length, "perturbed reactions...")
  console.log(perturbed_rxns)
  // Parse through each reaction listed and get the component parts
  let components = [];
  var rxn = 0;

  let degree_dictionary = data.degree_dictionary;

  for (rxn in perturbed_rxns[sample_id]) {

    var target_rxns = data.collapsed_reaction_dictionary[perturbed_rxns[sample_id][rxn]];

    components.push(target_rxns.id);
    for (x in target_rxns["reactants"]) {
      if (degree_dictionary[target_rxns["reactants"][x]] <= hub_value) {
        components.push(target_rxns["reactants"][x]);
      } else {
        console.log(
          "Filtering " +
          target_rxns["reactants"][x] +
          " (" +
          degree_dictionary[target_rxns["reactants"][x]] +
          " degrees) -- may cause edge loss"
        );
      }
    }
    for (x in target_rxns["products"]) {
      if (degree_dictionary[target_rxns["products"][x]] <= hub_value) {
        components.push(target_rxns["products"][x]);
      } else {
        console.log(
          "Filtering " +
          target_rxns["products"][x] +
          " (" +
          degree_dictionary[target_rxns["products"][x]] +
          " degrees) -- may cause edge loss"
        );
      }
    }
    for (x in target_rxns["modifiers"]) {
      if (degree_dictionary[target_rxns["modifiers"][x][0]] <= hub_value) {
        components.push(target_rxns["modifiers"][x][0]);
      } else {
        console.log(
          "Filtering " +
          target_rxns["modifiers"][x][0] +
          " (" +
          degree_dictionary[target_rxns["modifiers"][x][0]] +
          " degrees) -- may cause edge loss"
        );
      }
    }
    for (x in target_rxns["additional_components"]) {
      if (degree_dictionary[target_rxns["additional_components"][x]] <= hub_value) {
        components.push(target_rxns["additional_components"][x]);
      } else {
        console.log(
          "Filtering " +
          target_rxns["additional_components"][x] +
          " (" +
          degree_dictionary[target_rxns["additional_components"][x]] +
          " degrees) -- may cause edge loss"
        );
      }
    }
  }

  var elements = get_nodes_links(data, components);
  var new_nodes = elements[0];
  var new_links = elements[1];

  // Initialize variables
  var node_dict = {};
  var type_dict = {};

  var node_elements = initialize_nodes(new_nodes, node_dict, type_dict);
  var node_dict = node_elements[0];
  var type_dict = node_elements[1];
  var display_analytes_dict = node_elements[2];
  var display_reactions_dict = node_elements[3];
  var entity_id_dict = node_elements[4];

  var _width = window.innerWidth;
  var _height = window.innerHeight - 75;

  console.log("Displaying", new_nodes.length, "connected nodes")

  make_graph(
    data,
    new_nodes,
    new_links,
    type_dict,
    node_dict,
    entity_id_dict,
    display_analytes_dict,
    display_reactions_dict,
    selector,
    stat_type,
    _width,
    _height,
    global_motifs
  );
}



function highlight_mapping(_selector) {

  let _selectors = [
    "#conn_value_button",
    "#conn_stat_button"
  ]
  for (s in _selectors) {
    d3.select(_selectors[s])
      .style("background-color", "white");
  }
  d3.select(_selector)
    .style("background-color", "#FF7F7F");
}


async function main() {
  
  var database_url = await get_session_info_async("database_url");
  console.log("Database path: " + database_url);

  try {
    var data = JSON.parse(fs.readFileSync(database_url).toString());
  } catch (e) {
    alert('Failed to open: \n' + database_url)
  }
  console.log(data.metadata)
  var stat_type = data.metadata.stat_type;
  set_stat_button(stat_type);
  add_stat_threshold(stat_type);
  
  superPathwayDict = make_superPathway_dictionary(data);
  
  var motif_outputs = gatherMotifs(data, data.categories);
  collapsed_global_motifs = motif_outputs[0];
  global_motifs = motif_outputs[1];
  
  var names = data.labels.split(',');
  timecourse = checkCategories(data.categories, names); //, data.names);
  
  make_menu(
    superPathwayDict,
    "superPathwayMenu",
    "Select a super pathway...",
    (provide_all = true)
  );
  
  var path_mapper = data.motif_reaction_dictionary
  
  node_dict = {};
  for (let node in data.nodes) {
    node_dict[data.nodes[node]['id']] = data.nodes[node];
  }
  
  // Generate expression and stats dictionaries
  var expression_dict = {};
  var stats_dict = {};
  for (let x in data.nodes) {
    let id = data.nodes[x]['id'];
    let expression = data.nodes[x]['values'];
    let stats = data.nodes[x]['stats'];
  
    if (!expression.includes(null)) {
      expression_dict[id] = expression;
    }
    if (!stats.includes(null)) {
      stats_dict[id] = stats;
    }
  
  }
  
  // For quicker searching with new motifs
  var reaction_entity_dictionary = {};
  for (rxn in data.collapsed_reaction_dictionary) {
  
    let r = data.collapsed_reaction_dictionary[rxn];
    let entities = [];
    for (x in r["reactants"]) {
      entities.push(r["reactants"][x]);
    }
    for (x in r["products"]) {
      entities.push(r["products"][x]);
    }
    for (x in r["modifiers"]) {
      entities.push(r["modifiers"][x][0]);
    }
    for (x in r["additional_components"]) {
      entities.push(r["additional_components"][x]);
    }
  
    reaction_entity_dictionary[r.id] = entities;
  }
  
  var update_nodes = {};
  for (n in data.nodes) {
    update_nodes[data.nodes[n].id] = data.nodes[n];
  }
  data.nodes = update_nodes;
  
  var update_links = {};
  for (l in data.links) {
    let link_id = data.links[l].source + "," + data.links[l].target;
    update_links[link_id] = data.links[l];
  }
  data.links = update_links;
  
  data.blocklist = data.species_blocklist;
  data.blocklist = complete_blocklist(
    data.blocklist,
    data.metadata.blocklist,
    data.nodes
  )
  
  // Initialize slider if timecourse
  if (timecourse === true) {
    d3.select("circle#dot")
      .attr("x", 0)
  }
  

  function changeSuperConnect() {
    var superSelection = document.getElementById("superPathwayMenu").value;
    document.getElementById("type_selection_type").innerHTML = "Perturbations";
    document.getElementById("type_selection").innerHTML = superSelection;
  
    if (superSelection === "All entities" | superSelection === "All pathways") {
      selected_reactions = [];
      for (x in data.collapsed_reaction_dictionary) {
        selected_reactions.push(x)
      }
    } else {
      let reactome_id = superPathwayDict[superSelection]["reactome_id"]
  
      console.log(reactome_id)
      console.log(data)
      console.log(data.collapsed_pathway_dictionary)
  
      selected_reactions =
        data.collapsed_pathway_dictionary[reactome_id]['reactions']
    }
  
    // Initial play
    run_value_perturbations();
  }
  
  function run_value_perturbations() {

    highlight_mapping("#conn_value_button");
    let value_threshold = document.getElementById("conn_value_button").value;
    let perturbed_reactions = collect_perturbations(
      reaction_entity_dictionary,
      expression_dict,
      value_threshold,
      "value",
      data.categories);
    show_graph(data, perturbed_reactions, 0);
    if (timecourse === true) {
      d3.select("svg#slide")
        .on("click", () => {
          let sample_idx = d3.select("circle#dot").attr("x");
          if (sample_idx !== last_click) {
            show_graph(data, perturbed_reactions, sample_idx);
            last_click = sample_idx;
          }
        })
    }
  }
  
  function run_stat_perturbations() {
  
    highlight_mapping("#conn_stat_button");
    let stat_threshold = document.getElementById("conn_stat_button").value;
    let perturbed_reactions = collect_perturbations(
      reaction_entity_dictionary,
      stats_dict,
      stat_threshold,
      "stat",
      data.categories);
    show_graph(data, perturbed_reactions, 0);
    if (timecourse === true) {
      d3.select("svg#slide")
        .on("click", () => {
          let sample_idx = d3.select("circle#dot").attr("x");
          if (sample_idx !== last_click) {
            show_graph(data, perturbed_reactions, sample_idx);
            last_click = sample_idx;
          }
        })
    }
  }




  selected_reactions = [];
  d3.select("#superPathwayMenu").on("change", changeSuperConnect);
  d3.select("#play_button_value").on("click", run_value_perturbations);
  d3.select("#play_button_stat").on("click", run_stat_perturbations);
  d3.select("#kNN_button").on("change", run_value_perturbations);
  d3.select("#hub_button").on("change", run_value_perturbations);
  d3.select("#stat_button").on("change", function() {
    stat_input(data)
  });
}

// MAIN
main();
