"""License Information
Metaboverse:
    A toolkit for navigating and analyzing gene expression datasets
    alias: metaboverse
    Copyright (C) 2019  Jordan A. Berg
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
"""
from __future__ import print_function

"""Import dependencies
"""
import os
import sys
import re
import shutil
import time
import hashlib
import xml.etree.ElementTree as et

"""Import internal dependencies
"""
from app.python.utils import progress_feed

"""Global variables
"""
smbl_namespace = '{{http://www.sbml.org/sbml/level{0}/version{1}/core}}'
rdf_namespace = '{http://www.w3.org/1999/02/22-rdf-syntax-ns#}'
bqbiol_namespace = '{http://biomodels.net/biology-qualifiers/}'

"""Functions
"""
def unpack_pathways(
        output_dir,
        url='https://reactome.org/download/current/all_species.3.1.sbml.tgz'):
    """Load tarballed sbml reactome pathway files from reactome site
    """

    if output_dir[-1] != '/':
        output_dir = output_dir + '/'

    file = output_dir + url.split('/')[-1]

    os.system('curl -L ' + url + ' -o ' + file)

    pathways_dir = file[:-4] + '/'
    if os.path.exists(pathways_dir):
        shutil.rmtree(pathways_dir)
    os.makedirs(pathways_dir)
    os.system('tar -zxvf ' + file + ' -C ' + pathways_dir)
    try:
        os.remove(file)
    except:
        print('Could not find file: ' + file)

    return pathways_dir

def get_pathways(
        species_id,
        pathways_dir):
    """Get list of pathways to parse
    """

    # Check provided path exists
    if not os.path.isdir(pathways_dir):
        raise Exception(pathways_dir, 'does not exist')

    # Clean up path
    dir = os.path.abspath(pathways_dir) + '/'

    # Get list of files and their reaction name
    file_list = os.listdir(dir)
    pathways_list = [f for f in file_list if species_id in f]
    pathways_list = [f.split('.')[:-1][0] for f in pathways_list]

    return pathways_list

def get_database(
        pathways_dir,
        pathway_name):
    """Import sbml reaction data
    """

    if pathways_dir[-1] != '/':
        pathways_dir = pathways_dir + '/'

    pathway_file = pathways_dir + pathway_name + '.sbml'
    pathway_contents = et.parse(pathway_file)
    contents = pathway_contents.getroot()

    return contents

def get_metadata(
        reaction,
        smbl_level,
        smbl_version,
        smbl_namespace=smbl_namespace):
    """Get basic metadata for a reaction
    """

    compartment = reaction.attrib['compartment']
    id = reaction.attrib['id']
    name = reaction.attrib['name']

    reversible = reaction.attrib['reversible']
    if reversible == 'false':
        if '<' in name and '>' in name:
            reversible = 'true'

    notes = reaction.findall(
        str(smbl_namespace + 'notes').format(
            smbl_level,
            smbl_version
        )
    )[0][0].text

    return compartment, id, name, reversible, notes

def add_reaction(
        pathway_database,
        reaction,
        pathway,
        bqbiol_namespace=bqbiol_namespace,
        rdf_namespace=rdf_namespace):
    """Add reactions to pathway
    """

    for rank in reaction.iter(str(bqbiol_namespace + 'is')):
        for _rank in rank.iter(str(rdf_namespace + 'li')):
            try:
                item = _rank.attrib[str(rdf_namespace + 'resource')]
                if 'reactome' in item:
                    _id = item.split('/')[-1]
                    pathway_database[pathway]['reactions'].add(_id)
                else:
                    pass
            except:
                pass

    return pathway_database, _id

def add_reaction_components(
        type,
        reaction,
        smbl_namespace=smbl_namespace,
        smbl_level=smbl_level,
        smbl_version=smbl_version):
    """Add reaction components to reactions database
    For type, options are "listOfReactants", "listOfProducts", or
    "listOfModifiers"
    """

    # Collect modifiers for a given reaction by species ID
    component_list = reaction.findall(
        str(smbl_namespace + type).format(
            smbl_level,
            smbl_version
        )
    )

    if len(component_list) > 0:
        component_list = component_list[0]

    items = []
    for child in component_list:
        items.append(child.attrib['species'])

    return items

def add_names(
        name_database,
        child,
        search_string='is',
        bqbiol_namespace=bqbiol_namespace,
        rdf_namespace=rdf_namespace):
    """Add names to dictionary to map species ID
    """

    for rank in child.iter(str(bqbiol_namespace + search_string)):
        for _rank in rank.iter(str(rdf_namespace + 'li')):
            try:
                item = _rank.attrib[str(rdf_namespace + 'resource')]
                _id = item.split('/')[-1]
                if 'chebi' in item.lower():
                    _id = check_chebi(item=_id)
                name_database[_id] = specie

                # If element has parentheses, remove what's in between as
                # additional key
                if '(' in _id and ')' in _id:
                    name_database = add_alternative_names(
                        name_database=name_database,
                        item=_id,
                        specie=specie)

            except:
                pass

        return name_database

def add_alternative_names(
        name_database,
        item,
        specie):
    """Add alternative names to name database for mapping
    """

    _remove = item[item.find('(') : item.find(')') + 1]
    mod_item = item.replace(_remove, '')
    name_database[mod_item] = specie

    return name_database

def check_chebi(
        item):
    """Some special formatting handling for CHEBI entries
    """

    item_parsed = item.lower().split('chebi:')[1]
    item_returned = 'CHEBI:' + item_parsed

    return item_returned

def add_species(
        species_database,
        name_database,
        pathway_record,
        smbl_namespace=smbl_namespace,
        smbl_level=smbl_level,
        smbl_version=smbl_version,
        bqbiol_namespace=bqbiol_namespace,
        rdf_namespace=rdf_namespace):
    """Add species records for pathway to database
    """

    species = pathway_record.findall(
        str(smbl_namespace + 'listOfSpecies').format(
            smbl_level,
            smbl_version
        )
    )[0]

    # Collect species information
    for child in species:

        # Initialize specie record and add common name
        specie = child.attrib['id']
        name = child.attrib['name']

        print(specie)
        print(name)

        if '[' in name:
            name = name.split(' [')[0]

        species_database[specie] = name

        # Add names and ids to name dictionary
        name_database[name] = specie

        # Add source ID
        name_database = add_names(
            name_database=name_database,
            child=child,
            search_string='hasPart',
            bqbiol_namespace=bqbiol_namespace,
            rdf_namespace=rdf_namespace)

        name_database = add_names(
            name_database=name_database,
            child=child,
            search_string='is',
            bqbiol_namespace=bqbiol_namespace,
            rdf_namespace=rdf_namespace)

    return species_database, name_database

def process_components(
        output_dir,
        pathways_dir,
        pathways_list,
        species_id,
        args_dict=None,
        smbl_namespace=smbl_namespace,
        bqbiol_namespace=bqbiol_namespace,
        rdf_namespace=rdf_namespace):
    """Process species-specific pathways
    """

    # Initialize databases
    pathway_database = {}
    reaction_database = {}
    species_database = {}
    name_database = {}

    # Cycle through each pathway database and extract  contents
    for pathway in pathways_list:

        db =  get_database(
            pathways_dir,
            pathway)
        smbl_level = db.attrib['level']
        smbl_version = db.attrib['version']

        pathway_record = db.findall(
            str(smbl_namespace + 'model').format(
                smbl_level,
                smbl_version
            )
        )[0]

        pathway_info = pathway_record.attrib
        pathway_database[pathway] = {
            'id': pathway_info['id'],
            'name': pathway_info['name'],
            'reactions': set()
        }

        # Parse out reaction IDs and add to pathway_database
        reactions = pathway_record.findall(
            str(smbl_namespace + 'listOfReactions').format(
                smbl_level,
                smbl_version
            )
        )[0]

        # Extract reactions from pathway
        for reaction in reactions:

            # Get metadata
            compartment, id, name, reversible, notes = get_metadata(
                reaction=reaction,
                smbl_level=smbl_level,
                smbl_version=smbl_version,
                smbl_namespace=smbl_namespace)

            # Get pathway high-level information (reactions, name, compartment)
            pathway_database, reactome_id = add_reaction(
                pathway_database=pathway_database,
                reaction=reaction,
                pathway=pathway,
                bqbiol_namespace=bqbiol_namespace,
                rdf_namespace=rdf_namespace)
            name_database[name] = reactome_id

            # Collect reaction components
            reaction_database[reaction] = {}

            # Collect reactants for a given reaction by species ID
            reaction_database[reaction]['reactants'] = add_reaction_components(
                type='listOfReactants',
                reaction=reaction,
                smbl_namespace=smbl_namespace,
                smbl_level=smbl_level,
                smbl_version=smbl_version)

            # Collect products for a given reaction by species ID
            reaction_database[reaction]['products'] = add_reaction_components(
                type='listOfProducts',
                reaction=reaction,
                smbl_namespace=smbl_namespace,
                smbl_level=smbl_level,
                smbl_version=smbl_version)

            # Collect modifiers for a given reaction by species ID
            reaction_database[reaction]['modifiers'] = add_reaction_components(
                type='listOfReactants',
                reaction=reaction,
                smbl_namespace=smbl_namespace,
                smbl_level=smbl_level,
                smbl_version=smbl_version)

        # Convert reaction set for pathway to list
        pathway_database[pathway]['reactions'] = list(
            pathway_database[pathway]['reactions'])

        # Generate species dict
        species_database, name_database = add_species(
            species_database=species_database,
            name_database=name_database,
            pathway_record=pathway_record,
            smbl_namespace=smbl_namespace,
            smbl_level=smbl_level,
            smbl_version=smbl_version,
            bqbiol_namespace=bqbiol_namespace,
            rdf_namespace=rdf_namespace)

    return pathway_database, reaction_database, species_database, name_database

def __main__(
        species_id,
        output_dir,
        args_dict): # Location to output database file
    """Fetch all reactions for a given organism
    """

    species_id='HSA'
    output_dir='/Users/jordan/Desktop'
    args_dict=None
    pathways_dir = '/Users/jordan/Desktop/all_species.3.1.sbml/'

    # Get pathways files
    pathways_dir = unpack_pathways(
        output_dir=output_dir)
    progress_feed(args_dict, "reactions")

    pathways_list = get_pathways(
        species_id=species_id,
        pathways_dir=pathways_dir)

    # Get list of reaction files to use for populating database
    pathway_database, reaction_database, species_database, name_database = process_components(
        output_dir=output_dir,
        pathways_dir=pathways_dir,
        pathways_list=pathways_list,
        species_id=species_id,
        args_dict=args_dict)

    shutil.rmtree(output_dir)

    return pathway_database, reaction_database, species_database, name_database