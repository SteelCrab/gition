import os
import sys
sys.path.insert(0, os.path.abspath('..'))

project = 'Gition Backend'
copyright = '2024, Gition'
author = 'Gition'
version = '0.1'
release = '0.1.0'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
]

# Napoleon settings for Google/Numpy style docstrings
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

language = 'ko'

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# Autodoc settings
autodoc_member_order = 'bysource'
autodoc_typehints = 'description'
