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

function update_nodes_links(_nodes, _links) {
    var update_nodes = {};
    let n;
    for (n in _nodes) {
      update_nodes[_nodes[n].id] = _nodes[n];
    }
  
    var update_links = {};
    let l;
    for (l in _links) {
      let link_id = _links[l].source + "," + _links[l].target;
      update_links[link_id] = _links[l];
    }
    
    return [update_nodes, update_links];
  }
  
  function complete_blocklist(blocklist, blocklist_names, _nodes) {
  
    let split_blocklist = blocklist_names.split(',');
    let add_blocklist = [];
  
    for (let n in _nodes) {
      if (split_blocklist.includes(_nodes[n].name)) {
        add_blocklist.push(_nodes[n].id);
      }
    }
    
    return [... new Set(blocklist.concat(add_blocklist))];
  }
  
  function create_dictionaries(_nodes) {
    
    let expression_dict = {};
    let stats_dict = {};
    let inferred_dict = {};
    for (let x in _nodes) {
      let id = _nodes[x]['id'];
      let expression = _nodes[x]['values'];
      let stats = _nodes[x]['stats'];
      expression_dict[id] = expression;
      stats_dict[id] = stats;
      inferred_dict[id] = _nodes[x]['inferred']
    }
  
    return [expression_dict, stats_dict, inferred_dict];
  }
  
  function create_link_neighbors(_nodes, _links) {
  
    let link_neighbors = {};
    for (let l in _links) {
      let _source = _links[l].source;
      let _target = _links[l].target;
      
      if (_nodes[_source].type === "reaction" 
      || _nodes[_target].type === "reaction"
      || _nodes[_source].type === "collapsed"
      || _nodes[_target].type === "collapsed") {
      } else {
        if (!(_source in link_neighbors)) {
          link_neighbors[_source] = [];
        }
        link_neighbors[_source].push(_target);
    
        if (!(_target in link_neighbors)) {
          link_neighbors[_target] = [];
        }
        link_neighbors[_target].push(_source);
      }
    }
  
    return link_neighbors;
  }