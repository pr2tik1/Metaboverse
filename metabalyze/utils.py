"""License Information
MetaboNet-Analyzer:
    A toolkit for navigating and analyzing gene expression datasets
    alias: metabalyze
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

Progress bar:
    From https://gist.github.com/vladignatyev/06860ec2040cb497f0f3
    The MIT License (MIT)
    Copyright (c) 2016 Vladimir Ignatev

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the Software
    is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
    INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
    PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
    FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
    OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
    OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""
from __future__ import print_function

"""Import dependencies
"""
import os
import sys
import time
import datetime

"""Print out progress bar for long steps
"""
def progress_bar(
        counter,
        total,
        status=''):

    bar_len = 60
    filled_len = int(round(bar_len * counter / float(total)))

    percents = round(100.0 * counter / float(total), 1)
    bar = '=' * filled_len + '-' * (bar_len - filled_len)

    sys.stdout.write('[%s] %s%s ...%s\r' % (bar, percents, '%', status))
    sys.stdout.flush()

"""Print number of records read in
"""
def progress_counter(
        counter,
        status=''):

    sys.stdout.write('%s %s\r' % (counter, status))
    sys.stdout.flush()

"""Check directory formatting
"""
def check_directories(
        input,
        argument):

    # Check that a file wasn't passed in
    if os.path.isdir(input) != True:
        raise Exception(str(argument) + ': ' + str(input) + ' is not a directory')

    # Check input directory name is formatted correctly and fix if necessary
    input = os.path.abspath(input)

    if input.endswith('/'):
        pass
    else:
        input += '/'

    return input

"""Check file formatting
"""
def check_files(
        input,
        argument):

    # Check that a file wasn't passed in
    if os.path.isfile(input) != True:
        raise Exception(str(argument) + ': ' + str(input) + ' is not a file')

    # Check input directory name is formatted correctly and fix if necessary
    input = os.path.abspath(input)

    return input

"""Check curation arguments
"""
def check_curate(
        args_dict):

    print('coming soon')

"""Check analysis arguments
"""
def check_analyze(
        args_dict):

    print('coming soon')

"""Make log file for metabonet module
"""
def generate_log(
        args_dict):

    if 'experiment' in args_dict \
    and args_dict['experiment'] != None:
        args_dict['log'] = ' >> ' + str(args_dict['output']) + str(args_dict['experiment']) + '.log 2>&1'
        args_dict['log_file'] = str(args_dict['output']) + str(args_dict['experiment']) + '.log'

    else:
        cdt = datetime.datetime.now()
        args_dict['experiment'] = (
            str(args_dict['cmd'])
            + '_' + str(cdt.year)
            + '_' + str(cdt.month)
            + '_' + str(cdt.day)
            + '_' + str(cdt.hour)
            + 'h_' + str(cdt.minute)
            + 'm_' + str(cdt.second)
            + 's')
        args_dict['log'] = (
            ' >> '
            + str(args_dict['output'])
            + str(args_dict['experiment'])
            + '.log 2>&1')
        args_dict['log_file'] = (
            str(args_dict['output'])
            + str(args_dict['experiment'])
            + '.log')

    return args_dict

"""Run general checks on arguments
Not sub-module-specific
"""
def argument_checks(
        args_dict):

    # Check output file
    if 'output' in args_dict \
    and args_dict['output'] == None:
        args_dict['output'] = os.getcwd() + '/'

    # Check user-provided directory formatting
    for key, value in args_dict.items():

        if key == 'cmd':
            pass

        elif os.path.isdir(str(value)) == True:
            args_dict[key] = check_directories(
                args_dict[key],
                key)

        elif os.path.isfile(str(value)) == True:
            args_dict[key] = check_files(
            args_dict[key],
            key)

        else:
            pass

    return args_dict
