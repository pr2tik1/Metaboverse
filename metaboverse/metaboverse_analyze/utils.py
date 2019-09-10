"""License Information
Metabo-verse:
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
import re
import pandas as pd

# Check input is contains full path address
def file_path(input):

    return os.path.abspath(input)

# Get file suffix
def check_suffix(file):

    if file.split('.')[-1] == 'csv':
        suffix = ','
    elif file.split('.')[-1] == 'tsv':
        suffix = '\t'
    elif file.split('.')[-1] == 'txt':
        suffix = '\t'
    else:
        raise Exception('Invalid data file provided. Expected a tab- or comma-delimited file')

    return suffix

# Input data type
def add_data(file):

    # Check that file has full path
    file = file_path(file)

    # Figure out file type
    suffix = check_suffix(file)
    print(suffix)
    # Import dataframe
    data = pd.read_csv(
        file,
        sep = suffix,
        header = 0,
        index_col = 0,
        low_memory = False
    )

    return data

# Organize data in order and group replicates
def format_data(data, metadata):

    # Find replicates information
    replicates_col = [x for x in metadata.columns.tolist() if 'replicate' in x.lower()]
    if len(replicates_col) != 1:
        raise Exception('Could not find a single column in metadata with \'replicate\' label')
    replicates_col = replicates_col[0]

    condition_col = [x for x in metadata.columns.tolist() if 'condition' in x.lower()]
    if len(condition_col) != 1:
        raise Exception('Could not find a single column in metadata with \'condition\' label')
    condition_col = condition_col[0]

    # Map treatment name to columns of data
    label_dictionary = pd.Series(metadata[condition_col].values, index=metadata.index).to_dict()
    data.columns = data.columns.map(label_dictionary.get)

    # Collapse by same name
    data = data.groupby(data.columns, axis=1).mean()

    # Sort alphabetically
    data = data.reindex(sorted(data.columns), axis=1)

    return data

# Remove all non-number characters from column names
def format_times(name):

    name = re.sub("[^0-9]", "", name)
    name = int(name)

    return name

def sort_columns(data):

    # Make column names strings and sort time points
    data = data.sort_index(axis=1)
    data.columns = ['t' + str(n) for n in data.columns.tolist()]

    return data

# Smoothen time-course data with same amount of imputations between time points
def even_spacing(
    data,
    cols_numeric,
    tp_numbers,
    tp_total):

    tp_each = int(tp_total / (tp_numbers - 1)) + 1 # Get number of imputed time points between each measured time point

    # Impute time points between each time pair
    for i in range(len(cols_numeric) - 1):

        diff = cols_numeric[i + 1] - cols_numeric[i] # per pair of time-points, get the difference in time
        next_name = diff / tp_each # break time difference into increment size to add to each time name imputed
        next_data = (data[cols_numeric[i + 1]] - data[cols_numeric[i]]) / tp_each # get the amount to add each time

        last_name = cols_numeric[i]
        last_data = data[cols_numeric[i]] # Get last data column to be added to next time

        # Add columns with imputed times
        for j in range(tp_each - 1):

            last_name = last_name + next_name
            last_data = last_data + next_data
            data[last_name] = last_data

    return data

# Smoothen time-course data with proportional amount of imputations between time points based on distance between times
def ratio_spacing(
    data,
    cols_numeric,
    tp_numbers,
    tp_total):

    # Get the total time scale for the time course
    total_time = max(cols_numeric) - min(cols_numeric)

    # Impute time points between each time pair
    for i in range(len(cols_numeric) - 1):

        # For each time set, calculate its relative contribution of time, factor total imputations it gets
        diff = cols_numeric[i + 1] - cols_numeric[i] # per pair of time-points, get the difference in time
        balance = int(diff / total_time)

        next_name = diff / balance # break time difference into increment size to add to each time name imputed
        next_data = (data[cols_numeric[i + 1]] - data[cols_numeric[i]]) / balance # get the amount to add each time

        last_name = cols_numeric[i]
        last_data = data[cols_numeric[i]] # Get last data column to be added to next time

        # Add columns with imputed times
        for j in range(balance - 1):

            last_name = last_name + next_name
            last_data = last_data + next_data
            data[last_name] = last_data

    data = sort_columns(data)
    return data


# Search all reaction in compartment

# Search all reactions in pathway

# Search all reactions with x reactant

# Search all reactions with x product

# Search all reaction with x modifier
