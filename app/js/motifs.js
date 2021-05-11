/*
Metaboverse
Visualizing and Analyzing Metabolic Networks
https://github.com/Metaboverse/Metaboverse/
alias: metaboverse

Copyright (C) 2019-2021  Youjia Zhou, Jordan A. Berg
  zhou325 <at> sci <dot> utah <dot> edu
  jordan <dot> berg <at> biochem <dot> utah <dot> edu

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program.  If not, see <https://www.gnu.org/licenses/>.
*/
var path = require("path");
var eval_collapsed = false;
var eval_modifiers = false;
var excl_hubs = true;
var hub_threshold = 50;

window.addEventListener("load", function(event) {
  event.preventDefault();
  event.stopPropagation();

  var user_path = window.location.pathname;
  var page = user_path.split('/').pop();
  if (page === "motif.html") {
    document.getElementById("use_collapsed_id").onclick = function(event) {
      collapsedChecked()
    }
    document.getElementById("use_modifiers_id").onclick = function(event) {
      modifiersChecked()
    }
    document.getElementById("exclude_hubs_id").onclick = function(event) {
      hubsChecked()
    }
  }
})

function collapsedChecked() {
  if (eval_collapsed === false) {
    eval_collapsed = true;
  } else {
    eval_collapsed = false;
  }
  console.log("Motif evaluation includes collapsed reactions: ", eval_collapsed)
}

function modifiersChecked() {
  if (eval_modifiers === false) {
    eval_modifiers = true;
  } else {
    eval_modifiers = false;
  }
  console.log("Motif evaluation includes modifiers: ", eval_modifiers)
}

function hubsChecked() {
  if (excl_hubs === false) {
    excl_hubs = true;
  } else {
    excl_hubs = false;
  }
  console.log("High hub exlusion (more than", hub_threshold, "perturbations): ", excl_hubs)
}

function cleanHubs(
  excl_hubs,
  components,
  degree_dict,
  hub_threshold) {

  let filtered_hubs = components.filter(function(x) {
    if (degree_dict[x] <= hub_threshold) {
      return x
    }
  })
  return filtered_hubs;
}

function parseComponents(
  reaction,
  expression_dict,
  stats_dict,
  degree_dict,
  sample_index) {

  let reactants = reaction.reactants;
  let products = reaction.products;
  let modifiers = reaction.modifiers;

  let source_expression = [];
  let target_expression = [];

  let temp_reactants = $.extend(true, [], reactants);
  let temp_products = $.extend(true, [], products);

  if (eval_modifiers === true) {
    for (x in modifiers) {
      if (modifiers[x][1] === "catalyst") {
        temp_reactants.push(modifiers[x][0])
      } else if (modifiers[x][1] === "inhibitor") {
        temp_reactants.push(modifiers[x][0])
      } else {}
    }
  }

  let clean_reactants = [];
  let clean_products = [];
  if (excl_hubs === true) {
    clean_reactants = cleanHubs(
      excl_hubs,
      temp_reactants,
      degree_dict,
      hub_threshold)
    clean_products = cleanHubs(
      excl_hubs,
      temp_products,
      degree_dict,
      hub_threshold)
  } else {
    clean_reactants = temp_reactants;
    clean_products = temp_products;
  }

  clean_reactants.forEach(l => {
    let reactant_expr = expression_dict[l][sample_index];
    let reactant_stat = stats_dict[l][sample_index];
    if (reactant_expr !== null && reactant_stat !== null) {
      source_expression.push([
        parseFloat(reactant_expr),
        parseFloat(reactant_stat)
      ]);
    }
  })

  clean_products.forEach(l => {
    let product_expr = expression_dict[l][sample_index];
    let product_stat = stats_dict[l][sample_index];
    if (product_expr !== null && product_stat !== null) {
      target_expression.push([
        parseFloat(product_expr),
        parseFloat(product_stat),
      ]);
    }
  })

  let updated_source = source_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_target = target_expression.filter(function(value) {
    return !Number.isNaN(value);
  });

  return [updated_source, updated_target]
}

function parseComponentsMod(
  reaction,
  expression_dict,
  stats_dict,
  degree_dict,
  sample_index) {

  let core = reaction.reactants.concat(reaction.products);
  let modifiers = reaction.modifiers;

  let core_expression = [];
  let mods_expression = [];

  let temp_core = $.extend(true, [], core);
  let temp_mods = $.extend(true, [], modifiers);

  let clean_core = [];
  let clean_modifiers = [];
  if (excl_hubs === true) {
    clean_core = cleanHubs(
      excl_hubs,
      temp_core,
      degree_dict,
      hub_threshold)
    temp_mods = temp_mods.map(x => x[0]);
    clean_modifiers = cleanHubs(
      excl_hubs,
      temp_mods,
      degree_dict,
      hub_threshold)
  } else {
    clean_core = temp_core;
    clean_modifiers = temp_mods.map(x => x[0]);
  }

  clean_core.forEach(l => {
    let core_expr = expression_dict[l][sample_index];
    let core_stats = stats_dict[l][sample_index];
    if (core_expr !== null && core_stats !== null) {
      core_expression.push([parseFloat(core_expr), parseFloat(core_stats)]);
    }
  })

  clean_modifiers.forEach(l => {
    let mod_expr = expression_dict[l][sample_index];
    let mod_stats = stats_dict[l][sample_index];
    if (mod_expr !== null && mod_stats !== null) {
      mods_expression.push([parseFloat(mod_expr), parseFloat(mod_stats)]);
    }
  })

  let updated_core = core_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_mods = mods_expression.filter(function(value) {
    return !Number.isNaN(value);
  });

  return [updated_core, updated_mods]
}


function parseComponentsEnzymes(
  reaction,
  nodes,
  expression_dict,
  stats_dict,
  degree_dict,
  sample_index) {

  let core = reaction.reactants.concat(reaction.products);
  let modifiers = reaction.modifiers;

  let core_expression = [];
  let mods_expression = [];

  let temp_core = $.extend(true, [], core);
  let temp_mods = $.extend(true, [], modifiers);

  let clean_core = [];
  let clean_modifiers = [];
  if (excl_hubs === true) {
    clean_core = cleanHubs(
      excl_hubs, temp_core, degree_dict, hub_threshold)
    temp_mods = temp_mods.map(x => x[0]);
    clean_modifiers = cleanHubs(
      excl_hubs, temp_mods, degree_dict, hub_threshold)
  } else {
    clean_core = temp_core;
    clean_modifiers = temp_mods.map(x => x[0]);
  }

  clean_core.forEach(l => {
    if (nodes[l].sub_type !== "metabolite_component"
    && nodes[l].sub_type !== "") {
      let core_expr = expression_dict[l][sample_index];
      let core_stats = stats_dict[l][sample_index];
      if (core_expr !== null && core_stats !== null) {
        core_expression.push([parseFloat(core_expr), parseFloat(core_stats)]);
      }
    }
  })
  clean_modifiers.forEach(l => {
    if (nodes[l].sub_type !== "metabolite_component"
    && nodes[l].sub_type !== "") {
      let mod_expr = expression_dict[l][sample_index];
      let mod_stats = stats_dict[l][sample_index];
      if (mod_expr !== null && mod_stats !== null) {
        mods_expression.push([parseFloat(mod_expr), parseFloat(mod_stats)]);
      }
    }
  })

  let updated_core = core_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_mods = mods_expression.filter(function(value) {
    return !Number.isNaN(value);
  });

  return [updated_core, updated_mods]
}

function parseComponentsMetabolites(
  reaction,
  nodes,
  expression_dict,
  stats_dict,
  degree_dict,
  sample_index) {

  let core = reaction.reactants.concat(reaction.products);
  let modifiers = reaction.modifiers;

  let core_expression = [];
  let mods_expression = [];

  let temp_core = $.extend(true, [], core);
  let temp_mods = $.extend(true, [], modifiers);

  let clean_core = [];
  let clean_modifiers = [];
  if (excl_hubs === true) {
    clean_core = cleanHubs(
      excl_hubs, temp_core, degree_dict, hub_threshold)
    temp_mods = temp_mods.map(x => x[0]);
    clean_modifiers = cleanHubs(
      excl_hubs, temp_mods, degree_dict, hub_threshold)
  } else {
    clean_core = temp_core;
    clean_modifiers = temp_mods.map(x => x[0]);
  }

  clean_core.forEach(l => {
    if (nodes[l].sub_type === "metabolite_component") {
      let core_expr = expression_dict[l][sample_index];
      let core_stats = stats_dict[l][sample_index];
      if (core_expr !== null && core_stats !== null) {
        core_expression.push([parseFloat(core_expr), parseFloat(core_stats)]);
      }
    }
  })
  clean_modifiers.forEach(l => {
    if (nodes[l].sub_type === "metabolite_component") {
      let mod_expr = expression_dict[l][sample_index];
      let mod_stats = stats_dict[l][sample_index];
      if (mod_expr !== null && mod_stats !== null) {
        mods_expression.push([parseFloat(mod_expr), parseFloat(mod_stats)]);
      }
    }
  })

  let updated_core = core_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_mods = mods_expression.filter(function(value) {
    return !Number.isNaN(value);
  });

  return [updated_core, updated_mods]
}


function parseComponentsTrans(
  reaction,
  expression_dict,
  stats_dict,
  degree_dict,
  sample_index) {

  let reactants = reaction.reactants;
  let products = reaction.products;
  let modifiers = reaction.modifiers;

  let source_expression = [];
  let target_expression = [];
  let modifier_expression = [];

  let temp_reactants = $.extend(true, [], reactants);
  let temp_products = $.extend(true, [], products);
  let temp_modifiers = $.extend(true, [], modifiers);

  let clean_reactants = [];
  let clean_products = [];
  let clean_modifiers = [];
  if (excl_hubs === true) {
    clean_reactants = cleanHubs(
      excl_hubs,
      temp_reactants,
      degree_dict,
      hub_threshold)
    clean_products = cleanHubs(
      excl_hubs,
      temp_products,
      degree_dict,
      hub_threshold)
    parse_modifiers = temp_modifiers.map(x => x[0]);
    clean_modifiers = cleanHubs(
      excl_hubs,
      parse_modifiers,
      degree_dict,
      hub_threshold)
  } else {
    clean_reactants = temp_reactants;
    clean_products = temp_products;
    clean_modifiers = temp_modifiers.map(x => x[0]);
  }

  clean_reactants.forEach(l => {
    let reactant_expr = expression_dict[l][sample_index];
    let reactant_stats = stats_dict[l][sample_index];
    if (reactant_expr !== null && reactant_stats !== null) {
      source_expression.push([parseFloat(reactant_expr), parseFloat(reactant_stats)]);
    }
  })

  clean_products.forEach(l => {
    let product_expr = expression_dict[l][sample_index];
    let product_stats = stats_dict[l][sample_index];
    if (product_expr !== null && product_stats !== null) {
      target_expression.push([parseFloat(product_expr), parseFloat(product_stats)]);
    }
  })

  clean_modifiers.forEach(l => {
    let modifier_expr = expression_dict[l][sample_index];
    let modifier_stats = stats_dict[l][sample_index];
    if (modifier_expr !== null && modifier_stats !== null) {
      modifier_expression.push([parseFloat(modifier_expr), parseFloat(modifier_stats)]);
    }
  })

  let updated_source = source_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_target = target_expression.filter(function(value) {
    return !Number.isNaN(value);
  });
  let updated_modifier = modifier_expression.filter(function(value) {
    return !Number.isNaN(value);
  });

  return [updated_source, updated_target, updated_modifier]
}


function computeAvg(arr) {
  let arr_sum = arr[0];
  let arr_len = arr.length;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== null) {
      arr_sum += arr[i];
    } else {
      arr_len -= 1;
    }
  }
  let arr_avg = arr_sum / arr_len;
  return arr_avg;
}

// search for motif 1
//let threshold = d3.select("#avg_num").node().value;
function motifSearch_Avg(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {

  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);

      if (source_values.length > 0 && target_values.length > 0) {
        let source_avg = computeAvg(source_values);
        let target_avg = computeAvg(target_values);

        if (Math.abs(source_avg - target_avg) >= threshold) {
          let p_source = Math.max(...source_stats);
          let p_target = Math.max(...target_stats);
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = {
            "source": p_source,
            "target": p_target
          };
          reaction_copy.magnitude_change = Math.abs(source_avg - target_avg);
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  //console.log(discovered_motifs);
  return discovered_motifs;
}

// MaxMax
//let threshold = d3.select("#maxmax_num").node().value;
function motifSearch_MaxMax(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);
      if (source_values.length > 0 && target_values.length > 0) {
        let source_max = Math.max(...source_values);
        let target_max = Math.max(...target_values);

        if (Math.abs(source_max - target_max) >= threshold) {
          let source_index = source_values.indexOf(source_max);
          let target_index = target_values.indexOf(target_max);
          let p_source = source_stats[source_index];
          let p_target = target_stats[target_index];
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = {
            "source": p_source,
            "target": p_target
          };
          reaction_copy.magnitude_change = Math.abs(source_max - target_max);
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}

// MinMin
//let threshold = d3.select("#minmin_num").node().value;
function motifSearch_MinMin(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);

      if (source_values.length > 0 && target_values.length > 0) {
        let source_min = Math.min(...source_values);
        let target_min = Math.min(...target_values);

        if (Math.abs(source_min - target_min) >= threshold) {
          let source_index = source_values.indexOf(source_min);
          let target_index = target_values.indexOf(target_min);
          let p_source = source_stats[source_index];
          let p_target = target_stats[target_index];
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = {
            "source": p_source,
            "target": p_target
          };
          reaction_copy.magnitude_change = Math.abs(source_min - target_min);
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}


//MaxMin
//let threshold = d3.select("#maxmin_num").node().value;
function motifSearch_MaxMin(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);

      if (updated_source.length > 0 && updated_target.length > 0) {
        let source_max = Math.max(...source_values);
        let target_min = Math.min(...target_values);

        if (Math.abs(source_max - target_min) >= threshold) {
          let source_index = source_values.indexOf(source_max);
          let target_index = target_values.indexOf(target_min);
          let p_source = source_stats[source_index];
          let p_target = target_stats[target_index];
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = {
            "source": p_source,
            "target": p_target
          };
          reaction_copy.magnitude_change = Math.abs(source_max - target_min);
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}


//MinMax
//let threshold = d3.select("#minmax_num").node().value;
function motifSearch_MinMax(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);

      if (updated_source.length > 0 && updated_target.length > 0) {
        let source_min = Math.min(...source_values);
        let target_max = Math.max(...target_values);

        if (Math.abs(source_min - target_max) >= threshold) {
          let source_index = source_values.indexOf(source_min);
          let target_index = target_values.indexOf(target_max);
          let p_source = source_stats[source_index];
          let p_target = target_stats[target_index];
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = {
            "source": p_source,
            "target": p_target
          };
          reaction_copy.magnitude_change = Math.abs(source_min - target_max);
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}

//Sustained
//let threshold = d3.select("#sustained_num").node().value;
// Will not include sustained motif if the value on both sides exactly the same
function motifSearch_Sustained(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponents(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);

      if (source_values.length > 0 && target_values.length > 0) {

        // Sustained up-regulation
        let up_in = [];
        let up_out = [];
        let p_source_up;
        let p_target_up;
        let magnitude_change_up;
        for (i in source_values) {
          if (source_values[i] >= threshold) {
            up_in.push(source_values[i]);
          }
        }
        for (j in target_values) {
          if (target_values[j] >= threshold) {
            up_out.push(target_values[j]);
          }
        }
        if (up_in.length > 0 && up_out > 0) {
          let source_up = Math.min(...up_in)
          let target_up = Math.min(...up_out)
          let source_index = source_values.indexOf(source_up);
          let target_index = target_values.indexOf(target_up);
          p_source_up = source_stats[source_index];
          p_target_up = target_stats[target_index];
          magnitude_change_up = Math.abs(source_up -
            target_up);
        }

        // Sustained down-regulation
        let down_in = [];
        let down_out = [];
        let p_source_down;
        let p_target_down;
        let magnitude_change_down;
        for (k in source_values) {
          if (source_values[k] <= -(threshold)) {
            down_in.push(source_values[k]);
          }
        }
        for (l in target_values) {
          if (target_values[l] <= -(threshold)) {
            down_out.push(target_values[l]);
          }
        }
        if (down_in.length > 0 && down_out > 0) {
          let source_down = Math.min(...down_in)
          let target_down = Math.min(...down_out)
          let source_index = source_values.indexOf(source_down);
          let target_index = target_values.indexOf(target_down);
          p_source_down = source_stats[source_index];
          p_target_down = target_stats[target_index];
          magnitude_change_down = Math.abs(source_down -
            target_down);
        }

        if (((down_in.length > 0) && (down_out.length > 0)) ||
          ((up_in.length > 0) && (up_out.length > 0))) {

          let magnitude_change;
          let p_vals;
          if (magnitude_change_up && magnitude_change_down) {
            let up_max = Math.max(magnitude_change_up);
            let down_max = Math.max(magnitude_change_down);
            if (up_max >= down_max) {
              magnitude_change = magnitude_change_up;
              p_vals = {
                "source": p_source_up,
                "target": p_target_up
              }
            } else {
              magnitude_change = magnitude_change_down;
              p_vals = {
                "source": p_source_down,
                "target": p_target_down
              }
            }
          } else if (magnitude_change_up != undefined) {
            magnitude_change = magnitude_change_up;
            p_vals = {
              "source": p_source_up,
              "target": p_target_up
            }
          } else if (magnitude_change_down != undefined) {
            magnitude_change = magnitude_change_down;
            p_vals = {
              "source": p_source_down,
              "target": p_target_down
            }
          }
          let reaction_copy = $.extend(true, {}, reaction);
          reaction_copy.p_values = p_vals;
          reaction_copy.magnitude_change = magnitude_change;
          sample_motifs.add(reaction_copy);
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}

//Path max/min comparison
//let threshold = d3.select("#pathmax_num").node().value;
function motifSearch_PathMax(
  threshold,
  mod_collapsed_pathways,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    // For each pathway, get reactions
    for (pathway in mod_collapsed_pathways) {

      let values = [];
      let reactions = mod_collapsed_pathways[pathway].reactions;
      for (rxn in reactions) {
        let reaction = collapsed_reaction_dict[reactions[rxn]];
        let comps = parseComponents(
          reaction,
          expression_dict,
          stats_dict,
          degree_dict,
          _idx)
        let updated_source = comps[0];
        let updated_target = comps[1];
        let source_values = updated_source.map((i) => i[0]);
        let target_values = updated_target.map((i) => i[0]);

        // Combine all values
        values = values.concat(source_values, target_values);
      }
      if (values.length > 0) {
        if (Math.abs(Math.max.apply(Math, values) - Math.min.apply(Math, values)) >= threshold) {
          sample_motifs.add(mod_collapsed_pathways[pathway]);
        }
      }
    }
    discovered_motifs.push([...sample_motifs]);
  }
  return discovered_motifs;
  // Get expression for all entities of components
  // Compare min/max
  // Return to list if true
  // Will need to reformat motif display since just showing pathways, not reactions (make dummy reactions?)
  // Make sorting index for later that is also output

}

//Path coverage comparison
//let threshold = d3.select("#pathcov_num").node().value;
function motifSearch_PathCov(
  threshold,
  min_coverage,
  mod_collapsed_pathways,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    // For each pathway, get reactions
    for (pathway in mod_collapsed_pathways) {

      let values = 0;
      let total = 0;

      let reactions = mod_collapsed_pathways[pathway].reactions;
      for (rxn in reactions) {
        let reaction = collapsed_reaction_dict[reactions[rxn]];
        let comps = parseComponents(
          reaction,
          expression_dict,
          stats_dict,
          degree_dict,
          _idx)
        let updated_source = comps[0];
        let updated_target = comps[1];
        let source_stats = updated_source.map((i) => i[1]);
        let target_stats = updated_target.map((i) => i[1]);
        let source_stats_out = source_stats.filter(stat => stat < threshold);
        let target_stats_out = target_stats.filter(stat => stat < threshold);

        // Check that at least one component in the reaction meets thresholding
        // criteria
        if (source_stats_out.length + target_stats_out.length > 0) {
          values = values + 1;
        }
        total = total + 1;
      }

      let cov = values / total;
      if (cov >= min_coverage) {
        sample_motifs.add([
          mod_collapsed_pathways[pathway],
          cov,
          values,
          total
        ]);
      }
    }
    sample_motifs.sort(function(one, two) {
      return two[1] - one[1];
    });

    discovered_motifs[_idx] = sample_motifs;
  }
  return discovered_motifs;
}

function modifierReg(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  // If the net change between at least one modifier and one core component of a
  // reaction is greater than or equal to the threshold, return the reaction
  // *** Checking the "include modifiers" button will have no effect here
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponentsMod(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_core = comps[0];
      let updated_modifiers = comps[1];
      let core_values = updated_core.map((i) => i[0]);
      let modifier_values = updated_modifiers.map((i) => i[0]);
      let core_stats = updated_core.map((i) => i[1]);
      let modifier_stats = updated_modifiers.map((i) => i[1]);

      if (core_values.length > 0 && modifier_values.length > 0) {

        // Check each core/mod combination for a diff that meets threshold
        for (x in core_values) {
          for (y in modifier_values) {
            if (Math.abs(core_values[x] - modifier_values[y]) >= threshold) {
              let p_source = core_stats[x];
              let p_target = modifier_stats[y];
              let p_vals = {
                "source": p_source,
                "target": p_target
              };
              let magnitude_chg = Math.abs(core_values[x] - modifier_values[y]);

              let reaction_copy = $.extend(true, {}, reaction);
              if (reaction in sample_motifs) {
                if (magnitude_chg > reaction_copy.magnitude_change) {
                  reaction_copy.p_values = p_vals;
                  reaction_copy.magnitude_change = magnitude_chg;
                  sample_motifs.add(reaction_copy);
                }
              } else {
                reaction_copy.p_values = p_vals;
                reaction_copy.magnitude_change = magnitude_chg;
                sample_motifs.add(reaction_copy);
              }
            }
          }
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}

function modifierTransport(
  threshold,
  collapsed_reaction_dict,
  expression_dict,
  stats_dict,
  path_mapper,
  degree_dict,
  sample_indices) {
  // Highlight if modifier changed where inputs and outputs are same (minus
  //    compartment) --> regulation of transport reaction
  // If a componenet on both sides meets threshold and a modifier seperately
  // meets threshold, return
  let discovered_motifs = [];

  for (_idx in sample_indices) {
    let sample_motifs = new Set();

    for (let rxn in collapsed_reaction_dict) {
      let reaction = collapsed_reaction_dict[rxn];
      let comps = parseComponentsTrans(
        reaction,
        expression_dict,
        stats_dict,
        degree_dict,
        _idx)
      let updated_source = comps[0];
      let updated_target = comps[1];
      let updated_modifier = comps[2];
      let source_values = updated_source.map((i) => i[0]);
      let target_values = updated_target.map((i) => i[0]);
      let modifier_values = updated_modifier.map((i) => i[0]);
      let source_stats = updated_source.map((i) => i[1]);
      let target_stats = updated_target.map((i) => i[1]);
      let modifier_stats = updated_modifier.map((i) => i[1]);

      if (source_values.length > 0 &&
        target_values.length > 0 &&
        modifier_values.length > 0) {

        let intersect = source_values.filter(x => target_values.includes(x));
        for (x in intersect) {
          for (y in modifier_values) {
            if ((Math.abs(intersect[x] - modifier_values[y]) >= threshold) ||
              (Math.abs(intersect[x]) >= threshold &&
                Math.abs(modifier_values[y]) >= threshold)) {
              let source_index = source_values.indexOf(intersect[x]);
              let target_index = modifier_values.indexOf(modifier_values[y]);
              let p_source = source_stats[x];
              let p_target = modifier_stats[y];
              let p_vals = {
                "source": p_source,
                "target": p_target
              };
              let magnitude_chg = Math.abs(intersect[x] - modifier_values[y]);

              let reaction_copy = $.extend(true, {}, reaction);
              if (reaction in sample_motifs) {
                if (magnitude_chg > reaction_copy.magnitude_change) {
                  reaction_copy.p_values = p_vals;
                  reaction_copy.magnitude_change = magnitude_chg;
                  sample_motifs.add(reaction_copy);
                }
              } else {
                reaction_copy.p_values = p_vals;
                reaction_copy.magnitude_change = magnitude_chg;
                sample_motifs.add(reaction_copy);
              }
            }
          }
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['id']]
    }
    discovered_motifs.push(sample_motifs);
  }
  return discovered_motifs;
}

// 1. Biggest difference b/t reactions passes threshold
function get_same_diff(base_comp, neighbor_comp, threshold) {
  let one_max = 0;
  let one_pair = [];
  let two_max = 0;
  let two_pair = [];
  for (let i in base_comp) {
    if (Math.abs(base_comp[i][0]) > one_max) {
      one_max = Math.abs(base_comp[i][0]);
      one_pair = base_comp[i];
    }
  }
  for (let i in neighbor_comp) {
    if (Math.abs(neighbor_comp[i][0]) > two_max) {
      two_max = Math.abs(neighbor_comp[i][0]);
      two_pair = neighbor_comp[i];
    }
  }
  if (one_max > threshold
  && two_max > threshold) {
    let same_max = Math.max([one_max, two_max]);
    let same_diff = [one_pair, two_pair];
    return [same_max, same_diff];
  } else {
    return false;
  }
}

// 2. One component from each reaction passes threshold
function get_big_diff(base_comp, neighbor_comp, threshold) {
  let diff_max = 0;
  let diff_pair = [];
  for (let i in base_comp) {
    for (let j in neighbor_comp) {
      if (Math.abs(base_comp[i][0] - neighbor_comp[j][0]) > diff_max) {
        diff_max = Math.abs(base_comp[i][0] - neighbor_comp[j][0]);
        diff_pair = [base_comp[i], neighbor_comp[j]]
      }
    }
  }
  if (diff_max > threshold) {
    return [diff_max, diff_pair];
  } else {
    return false;
  }

}


function enzymeMotif(
    threshold,
    collapsed_reaction_dict,
    expression_dict,
    stats_dict,
    path_mapper,
    degree_dict,
    sample_indices,
    nodes,
    neighbors_dictionary) {

    // If two neighboring reactions have significantly shifting enzyme conc.
    // If both change above/below a threshold, or the difference between the
    // two passes the threshold
    //
    // Consider all non-metabolites from each neighboring reaction
    // If largest difference passes, consider as a motif
    // Or if both change in the same direction and pass the threshold, return
    // Considers modifiers by default
    let discovered_motifs = [];

    for (_idx in sample_indices) {

      // neighbors_dictionary
      let sample_motifs = new Set();

      for (let neighbor in neighbors_dictionary) {

        // check each neighbor pair for components (non-metabolite)
        if (neighbor in collapsed_reaction_dict && neighbors_dictionary[neighbor].length > 0) {

          // Get evaluated reaction info
          let reaction = collapsed_reaction_dict[neighbor];
          let comps = parseComponentsEnzymes(
            reaction,
            nodes,
            expression_dict,
            stats_dict,
            degree_dict,
            _idx)
          comps = comps[0].concat(comps[1]);

          // Get neighboring reaction(s) info
          for (let n_reaction in neighbors_dictionary[neighbor]) {
            let this_neighbor = neighbors_dictionary[neighbor][n_reaction];
            if (this_neighbor in collapsed_reaction_dict) {
              let neighbor_reaction = collapsed_reaction_dict[this_neighbor];
              let neighbor_comps = parseComponentsEnzymes(
                neighbor_reaction,
                nodes,
                expression_dict,
                stats_dict,
                degree_dict,
                _idx)
              neighbor_comps = neighbor_comps[0].concat(neighbor_comps[1]);

              // Check for conditions
              let same_diff = get_same_diff(comps, neighbor_comps, threshold);
              let big_diff = get_big_diff(comps, neighbor_comps, threshold);
              if (same_diff !== false || big_diff !== false) {
                let collapsed = "false";
                if (reaction.collapsed === "true"
                || neighbor_reaction.collapsed === "true") {
                  collapsed = "true";
                }
                let mag_change, p_source, p_target;
                if (same_diff[0] > big_diff[0] && same_diff !== false) {
                  mag_change = same_diff[0];
                  p_source = same_diff[1][0][1];
                  p_target = same_diff[1][1][1];
                } else if (big_diff !== false) {
                  mag_change = big_diff[0];
                  p_source = big_diff[1][0][1];
                  p_target = big_diff[1][1][1];
                }
                sample_motifs.add({
                  'id': reaction.id + "_" + neighbor_reaction.id,
                  'rxn1': $.extend(true, {}, reaction),
                  'rxn2': $.extend(true, {}, neighbor_reaction),
                  'collapsed': collapsed,
                  'magnitude_change': mag_change,
                  'p_values': {
                    'source': p_source,
                    'target': p_target
                  }
                })
              }
            }
          }
        }
      }
      sample_motifs = [...sample_motifs];
      for (let m in sample_motifs) {
        sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['rxn1']['id']].concat(path_mapper[sample_motifs[m]['rxn2']['id']])
      }
      discovered_motifs.push(sample_motifs);
    }
  return discovered_motifs;
}


function activityMotif(
    threshold,
    collapsed_reaction_dict,
    expression_dict,
    stats_dict,
    path_mapper,
    degree_dict,
    sample_indices,
    nodes,
    neighbors_dictionary) {

  // If two neighboring reactions have significantly shifting enzyme conc.
  // If both change above/below a threshold, or the difference between the
  // two passes the threshold
  //
  // Consider all metabolites from each neighboring reaction
  // If largest difference passes, consider as a motif
  // Or if both change in the same direction and pass the threshold, return
  // Considers modifiers by default
  let discovered_motifs = [];

  for (_idx in sample_indices) {

    // neighbors_dictionary
    let sample_motifs = new Set();

    for (let neighbor in neighbors_dictionary) {

      // check each neighbor pair for components (non-metabolite)
      if (neighbor in collapsed_reaction_dict && neighbors_dictionary[neighbor].length > 0) {

        // Get evaluated reaction info
        let reaction = collapsed_reaction_dict[neighbor];
        let comps = parseComponentsMetabolites(
          reaction,
          nodes,
          expression_dict,
          stats_dict,
          degree_dict,
          _idx)
        comps = comps[0].concat(comps[1]);

        // Get neighboring reaction(s) info
        for (let n_reaction in neighbors_dictionary[neighbor]) {
          let this_neighbor = neighbors_dictionary[neighbor][n_reaction];
          if (this_neighbor in collapsed_reaction_dict) {
            let neighbor_reaction = collapsed_reaction_dict[this_neighbor];
            let neighbor_comps = parseComponentsMetabolites(
              neighbor_reaction,
              nodes,
              expression_dict,
              stats_dict,
              degree_dict,
              _idx)
            neighbor_comps = neighbor_comps[0].concat(neighbor_comps[1]);

            // Check for conditions
            let same_diff = get_same_diff(comps, neighbor_comps, threshold);
            let big_diff = get_big_diff(comps, neighbor_comps, threshold);
            if (same_diff !== false || big_diff !== false) {
              let collapsed = "false";
              if (reaction.collapsed === "true"
              || neighbor_reaction.collapsed === "true") {
                collapsed = "true";
              }
              let mag_change, p_source, p_target;
              if (same_diff[0] > big_diff[0] && same_diff !== false) {
                mag_change = same_diff[0];
                p_source = same_diff[1][0][1];
                p_target = same_diff[1][1][1];
              } else if (big_diff !== false) {
                mag_change = big_diff[0];
                p_source = big_diff[1][0][1];
                p_target = big_diff[1][1][1];
              }
              sample_motifs.add({
                'id': reaction.id + "_" + neighbor_reaction.id,
                'rxn1': $.extend(true, {}, reaction),
                'rxn2': $.extend(true, {}, neighbor_reaction),
                'collapsed': collapsed,
                'magnitude_change': mag_change,
                'p_values': {
                  'source': p_source,
                  'target': p_target
                }
              })
            }
          }
        }
      }
    }
    sample_motifs = [...sample_motifs];
    for (let m in sample_motifs) {
      sample_motifs[m]['pathways'] = path_mapper[sample_motifs[m]['rxn1']['id']].concat(path_mapper[sample_motifs[m]['rxn2']['id']])
    }
    discovered_motifs.push(sample_motifs);
  }
return discovered_motifs;
}


function make_neighbors_dictionary(data, degree_dict) {

  let nodes = data.nodes;
  let links = data.links;
  let neighbors_dictionary = {};

  for (let l in links) {
    let one = links[l].source;
    let two = links[l].target;

    if (excl_hubs === true
    && (degree_dict[one] > hub_threshold
      || degree_dict[two] > hub_threshold
    )) {
      // Skip if one of the two connected components don't match hub threshold
    } else {
      if (one in neighbors_dictionary) {
        neighbors_dictionary[one].add(two);
      } else {
        neighbors_dictionary[one] = new Set();
        neighbors_dictionary[one].add(two);
      }
      if (two in neighbors_dictionary) {
        neighbors_dictionary[two].add(one);
      } else {
        neighbors_dictionary[two] = new Set();
        neighbors_dictionary[two].add(one);
      }
    }
  }
  let neighbors = Object.keys(neighbors_dictionary);

  var reaction_neighbors_dictionary = {};
  let reactions = data.reaction_dictionary;
  for (let neighbor in neighbors) {
    if (neighbors[neighbor] in reactions) {
      let components = [...neighbors_dictionary[neighbors[neighbor]]];
      let connected_reactions = new Set()
      for (let _c in components) {
        let sub_components = [...neighbors_dictionary[components[_c]]];
        for (let _c_ in sub_components) {
          if (sub_components[_c_] in reactions &&
              neighbors[neighbor] !== sub_components[_c_]) {
            connected_reactions.add(sub_components[_c_]);
          }
        }
      }
      reaction_neighbors_dictionary[neighbors[neighbor]] = [
        ...connected_reactions
      ];
    }
  }

  var collapsed_reaction_neighbors_dictionary = {};
  let collapsed_reactions = data.collapsed_reaction_dictionary
  for (let neighbor in neighbors) {
    if (neighbors[neighbor] in collapsed_reactions) {
      let components = [...neighbors_dictionary[neighbors[neighbor]]];
      let connected_collapsed_reactions = new Set()
      for (let _c in components) {
        let sub_components = [...neighbors_dictionary[components[_c]]];
        for (let _c_ in sub_components) {
          if (sub_components[_c_] in collapsed_reactions &&
              neighbors[neighbor] !== sub_components[_c_]) {
            connected_collapsed_reactions.add(sub_components[_c_]);
          }
        }
      }
      collapsed_reaction_neighbors_dictionary[neighbors[neighbor]] = [
        ...connected_collapsed_reactions
      ];
    }
  }

  return [
    reaction_neighbors_dictionary,
    collapsed_reaction_neighbors_dictionary
  ];
}



function test() {
  var assert = require('assert');
  var {
    JSDOM
  } = require('jsdom');
  var jsdom = new JSDOM('<!doctype html><html><body></body></html>');
  var {
    window
  } = jsdom;
  $ = global.jQuery = require('jquery')(window);

  let test_sample_indices = [0, 1];
  let test_components = ['N1', 'N2'];
  let test_reaction = {
    'R1': {
      'id': 'R1',
      'reactants': ['N1'],
      'products': ['N2'],
      'modifiers': [
        ['N3', 'catalyst']
      ]
    },
    'R2': {
      'id': 'R2',
      'reactants': ['N4', 'N5'],
      'products': ['N6'],
      'modifiers': [
        ['N7', 'catalyst']
      ]
    },
    'R3': {
      'id': 'R3',
      'reactants': ['N8'],
      'products': ['N9', 'N10'],
      'modifiers': [
        ['N11', 'inhibitor']
      ]
    },
    'R4': {
      'id': 'R4',
      'reactants': ['N12', 'N13'],
      'products': ['N14', 'N15'],
      'modifiers': []
    },
    'R5': {
      'id': 'R5',
      'reactants': ['N16'],
      'products': ['N17'],
      'modifiers': []
    },
    'R6': {
      'id': 'R6',
      'reactants': ['N18', 'N19'],
      'products': ['N20'],
      'modifiers': [
        ['N21', 'catalyst'],
        ['N22', 'inhibitor']
      ]
    },
  }
  let test_expression_dict = {
    'N1': [0.9, 1], //
    'N2': [0.8, 2],
    'N3': [0.7, 3], //mod

    'N4': [5, 3],
    'N5': [5, 3], //
    'N6': [1, 1],
    'N7': [0, 1], //mod

    'N8': [0.7, 1], //
    'N9': [0.7, 1],
    'N10': [null, null],
    'N11': [3, 3], //mod

    'N12': [0.7, 3],
    'N13': [0.7, 0], //
    'N14': [0, 0],
    'N15': [1, 1],

    'N16': [0.7, 0.7], //
    'N17': [0.7, 0.7],

    'N18': [0.9, 2],
    'N19': [0.1, 0.03], //
    'N20': [7, 3],
    'N21': [7, 3], //mod
    'N22': [1, 3] //mod
  }
  let test_stats_dict = {
    'N1': [0.1, 0.05],
    'N2': [0.2, 0.02],
    'N3': [null, null],
    'N4': [0.3, 0.01],
    'N5': [0.4, 0.02],
    'N6': [0.5, 0.03],
    'N7': [0.6, 0.04],
    'N8': [0.7, 0.05],
    'N9': [0.8, 0.06],
    'N10': [null, null],
    'N11': [0.9, 0.07],
    'N12': [0.8, 0.08],
    'N13': [0.7, 0.09],
    'N14': [0.6, 0.09],
    'N15': [0.5, 0.08],
    'N16': [0.4, 0.07],
    'N17': [0.3, 0.06],
    'N18': [0.2, 0.05],
    'N19': [0.1, 0.04],
    'N20': [0.11, 0.03],
    'N21': [0.2, 0.02],
    'N22': [0.3, 0.01]
  }
  let test_degree_dict = {
    'N1': 1000,
    'N2': 10,
    'N3': 1,
    'N4': 3,
    'N5': 10,
    'N6': 7,
    'N7': 6,
    'N8': 100,
    'N9': 40,
    'N10': 24,
    'N11': 13,
    'N12': 11,
    'N13': 4,
    'N14': 6,
    'N15': 13,
    'N16': 9,
    'N17': 7,
    'N18': 4,
    'N19': 5,
    'N20': 2,
    'N21': 1,
    'N22': 99
  }
  let test_path_mapper = {
    'R1': ['P1', 'P2', 'P3', 'P4'],
    'R2': ['P5', 'P6'],
    'R3': ['P5', 'P9'],
    'R4': ['P1', 'P3'],
    'R5': ['P2', 'P4'],
    'R6': ['P1']
  }

  describe('motifs.js', function() {
    // modifiersChecked()
    describe('modifiersChecked()', function() {
      it('should return false if eval_modifiers true, and vice versa', function() {
        assert(eval_modifiers === false);
        modifiersChecked();
        assert(eval_modifiers === true);
        modifiersChecked();
        assert(eval_modifiers === false);
      })
    })
    // hubsChecked()
    describe('hubsChecked()', function() {
      it('should return false if excl_hubs true, and vice versa', function() {
        assert(excl_hubs === false);
        hubsChecked();
        assert(excl_hubs === true);
        hubsChecked();
        assert(excl_hubs === false);
      })
    })
    // cleanHubs()
    describe('cleanHubs()', function() {
      it('should filter out nodes with a degree higher than the threshold', function() {
        let test_excl_hubs = true
        let test_filter_hubs = cleanHubs(
          test_excl_hubs,
          test_components,
          test_degree_dict,
          50)
        assert(test_filter_hubs.length === 1)
        assert(test_filter_hubs[0] === 'N2')
      })
    })
    // parseComponents()
    describe('parseComponents()', function() {
      it('should parse component values after degree cleaning', function() {
        excl_hubs = false;
        let test_items, test_updated_source, test_updated_target;
        test_items = parseComponents(
          test_reaction['R1'],
          test_expression_dict,
          test_stats_dict,
          test_degree_dict,
          0)
        test_updated_source = test_items[0];
        test_updated_target = test_items[1];
        assert(test_updated_source.length === 1)
        assert(test_updated_source[0][0] === 0.9)
        assert(test_updated_source[0][1] === 0.1)
        assert(test_updated_target.length === 1)
        assert(test_updated_target[0][0] === 0.8)
        assert(test_updated_target[0][1] === 0.2)
        excl_hubs = true;
        test_items = parseComponents(
          test_reaction['R1'],
          test_expression_dict,
          test_stats_dict,
          test_degree_dict,
          0)
        test_updated_source = test_items[0];
        test_updated_target = test_items[1];
        assert(test_updated_source.length === 0)
        assert(test_updated_target.length === 1)
        assert(test_updated_target[0][0] === 0.8)
        assert(test_updated_target[0][1] === 0.2)
      })
    })
    // parseComponentsMod()
    describe('parseComponentsMod()', function() {
      it('should parse component values after degree cleaning with modifiers considered', function() {

        excl_hubs = false;
        let test_items, test_updated_core, test_updated_mods;
        test_items = parseComponentsMod(
          test_reaction['R1'],
          test_expression_dict,
          test_stats_dict,
          test_degree_dict,
          0)
        test_updated_source = test_items[0];
        test_updated_target = test_items[1];
        assert(test_items.length === 2)
        assert(test_updated_source.length === 2)
        assert(test_updated_target.length === 0)
        assert(test_updated_source[0][0] === 0.9)
        assert(test_updated_source[0][1] === 0.1)
        assert(test_updated_source[1][0] === 0.8)
        assert(test_updated_source[1][1] === 0.2)
      })
    })
    // parseComponentsTrans()
    describe('parseComponentsTrans()', function() {
      it('should parse component values after degree cleaning with modifiers considered', function() {
        excl_hubs = false;
        let test_items, test_updated_core, test_updated_mods;
        test_items = parseComponentsTrans(
          test_reaction['R1'],
          test_expression_dict,
          test_stats_dict,
          test_degree_dict,
          0)
        test_updated_source = test_items[0];
        test_updated_target = test_items[1];
        test_updated_modifiers = test_items[2];
        assert(test_items.length === 3)
        assert(test_updated_source.length === 1)
        assert(test_updated_source[0][0] === 0.9)
        assert(test_updated_source[0][1] === 0.1)
        assert(test_updated_target.length === 1)
        assert(test_updated_target[0][0] === 0.8)
        assert(test_updated_target[0][1] === 0.2)
        assert(test_updated_modifiers.length === 0)
      })
    })
    // computeAvg()
    describe('computeAvg()', function() {
      it('should return the average of the input array', function() {
        let test_array, test_array_out;
        test_array = [0, 1, 2];
        test_array_out = computeAvg(test_array)
        assert(test_array_out === 1)
        test_array = [0, 1, null];
        test_array_out = computeAvg(test_array)
        assert(test_array_out === 0.5)
        test_array = [null, null];
        test_array_out = computeAvg(test_array)
        assert(test_array_out === 0)
      })
    })
    // motifSearch_MaxMax()
    describe('motifSearch_MaxMax()', function() {
      it('should return 2 motifs for sample 0 and 4 motifs for sample 1', function() {
        let test_threshold = 1;
        let maxmax_results = motifSearch_MaxMax(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(maxmax_results[0].length === 2)
        if (maxmax_results[0][0].magnitude_change === 4 &&
          maxmax_results[0][1].magnitude_change === 6.1) {} else {
          assert(false)
        }
        assert(maxmax_results[1].length === 4)
        if (maxmax_results[1][0].magnitude_change === 1 &&
          maxmax_results[1][1].magnitude_change === 2 &&
          maxmax_results[1][2].magnitude_change === 2 &&
          maxmax_results[1][3].magnitude_change === 1) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_Avg()
    describe('motifSearch_Avg()', function() {
      it('should return 2 motifs for sample 0 and 4 motifs for sample 1', function() {
        let test_threshold = 1;
        let avg_results = motifSearch_Avg(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(avg_results[0].length === 2)
        if (avg_results[0][0].magnitude_change === 4 &&
          avg_results[0][1].magnitude_change === 6.5) {} else {
          assert(false)
        }
        assert(avg_results[1].length === 4)
        if (avg_results[1][0].magnitude_change === 1 &&
          avg_results[1][1].magnitude_change === 2 &&
          avg_results[1][2].magnitude_change === 1 &&
          avg_results[1][3].magnitude_change === 1.985) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_MinMin()
    describe('motifSearch_MinMin()', function() {
      it('should return 2 motifs for sample 0 and 3 motifs for sample 1', function() {
        let test_threshold = 1;
        let minmin_results = motifSearch_MinMin(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(minmin_results[0].length === 2)
        if (minmin_results[0][0].magnitude_change === 4 &&
          minmin_results[0][1].magnitude_change === 6.9) {} else {
          assert(false)
        }
        assert(minmin_results[1].length === 3)
        if (minmin_results[1][0].magnitude_change === 1 &&
          minmin_results[1][1].magnitude_change === 2 &&
          minmin_results[1][2].magnitude_change === 2.97) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_MaxMin()
    describe('motifSearch_MaxMin()', function() {
      it('should return 2 motifs for sample 0 and 4 motifs for sample 1', function() {
        let test_threshold = 1;
        let maxmin_results = motifSearch_MaxMin(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(maxmin_results[0].length === 2)
        if (maxmin_results[0][0].magnitude_change === 4 &&
          maxmin_results[0][1].magnitude_change === 6.1) {} else {
          assert(false)
        }
        assert(maxmin_results[1].length === 4)
        if (maxmin_results[1][0].magnitude_change === 1 &&
          maxmin_results[1][1].magnitude_change === 2 &&
          maxmin_results[1][2].magnitude_change === 3 &&
          maxmin_results[1][3].magnitude_change === 1) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_MinMax()
    describe('motifSearch_MinMax()', function() {
      it('should return 2 motifs for sample 0 and 4 motifs for sample 1', function() {
        let test_threshold = 1;
        let minmax_results = motifSearch_MinMax(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(minmax_results[0].length === 2)
        if (minmax_results[0][0].magnitude_change === 4 &&
          minmax_results[0][1].magnitude_change === 6.9) {} else {
          assert(false)
        }
        assert(minmax_results[1].length === 4)
        if (minmax_results[1][0].magnitude_change === 1 &&
          minmax_results[1][1].magnitude_change === 2 &&
          minmax_results[1][2].magnitude_change === 1 &&
          minmax_results[1][3].magnitude_change === 2.97) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_Sustained()
    describe('motifSearch_Sustained()', function() {
      it('should return 1 motifs for sample 0 and 5 motifs for sample 1', function() {
        let test_threshold = 1;
        let sustained_results = motifSearch_Sustained(
          test_threshold,
          test_reaction,
          test_expression_dict,
          test_stats_dict,
          test_path_mapper,
          test_degree_dict,
          test_sample_indices)
        assert(sustained_results[0].length === 1)
        if (sustained_results[0][0].magnitude_change === 4) {} else {
          assert(false)
        }
        assert(sustained_results[1].length === 5)
        if (sustained_results[1][0].magnitude_change === 1 &&
          sustained_results[1][1].magnitude_change === 2 &&
          sustained_results[1][2].magnitude_change === 0 &&
          sustained_results[1][3].magnitude_change === 2 &&
          sustained_results[1][4].magnitude_change === 1) {} else {
          assert(false)
        }
      })
    })
    // motifSearch_PathMax()
    // motifSearch_PathCov()
    // modifierReg()
    // modifierTransport()
  })
}
module.exports = test
