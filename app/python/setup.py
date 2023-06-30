"""License Information
metaboverse-cli
Back-end CLI Tool for Curating Metabolic Networks for Metaboverse
https://github.com/Metaboverse/metaboverse-cli/
alias: metaboverse-cli

MIT License

Copyright (c) 2022 Metaboverse

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

"""

from setuptools import setup, find_packages
from pathlib import Path
import re
import os

__path__ = Path(__file__).resolve().parent

# Get version from Metaboverse/app/__version__.txt 

with open(os.path.join(__path__, '__version__.txt'), 'r') as f:
    __version__ = f.read().strip()

# Get long description from README.md
with open(os.path.join(__path__, 'README.md'), 'r') as f:
    long_description = f.read()

# Get requirements from requirements.txt
with open(os.path.join(__path__, 'requirements.txt'), 'r') as f:
    requirements = f.read().splitlines()

# Get license from LICENSE
with open(os.path.join(__path__, 'LICENSE'), 'r') as f:
    license = f.read()


"""Setup arguments"""
setup(
    name='metaboverse-cli',
    version=__version__,
    description='A toolkit for navigating and analyzing biological networks',
    author='Jordan A. Berg',
    author_email='jordanberg.contact@gmail.com',
    url='https://github.com/Metaboverse',
    long_description=long_description,
    long_description_content_type='text/markdown',
    packages=find_packages(),
    exclude=[
        os.path.join('metaboverse_cli', 'test'),
        os.path.join('metaboverse_cli', 'mapper', 'test'),
        os.path.join('metaboverse_cli', 'curate', 'test'),
        os.path.join('metaboverse_cli', 'analyze', 'test'),
        'docs'
    ],
    license='MIT',
    zip_safe=False,
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "metaboverse = metaboverse_cli.__main__:main"
        ]
    },
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Science/Research',
        'Topic :: Scientific/Engineering :: Bio-Informatics',
        'Topic :: Scientific/Engineering :: Visualization',

    ]
)
