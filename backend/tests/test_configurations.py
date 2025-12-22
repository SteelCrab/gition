"""
Configuration and Documentation Validation Tests

Tests for validating GitHub configuration files (workflows, dependabot)
and documentation (README.md) to ensure correctness and consistency.
"""
import pytest
import yaml
import re
import os
from pathlib import Path
from typing import Dict, List, Any
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestDependabotConfiguration:
    """Test suite for .github/dependabot.yml validation"""
    
    @pytest.fixture
    def dependabot_config_path(self):
        """Fixture providing path to dependabot config"""
        repo_root = Path(__file__).parent.parent.parent
        return repo_root / ".github" / "dependabot.yml"
    
    @pytest.fixture
    def dependabot_config(self, dependabot_config_path):
        """Fixture loading dependabot configuration"""
        with open(dependabot_config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def test_dependabot_file_exists(self, dependabot_config_path):
        """Test that dependabot.yml file exists"""
        assert dependabot_config_path.exists(), "dependabot.yml should exist"
        assert dependabot_config_path.is_file(), "dependabot.yml should be a file"
    
    def test_dependabot_valid_yaml(self, dependabot_config_path):
        """Test that dependabot.yml is valid YAML"""
        try:
            with open(dependabot_config_path, 'r') as f:
                config = yaml.safe_load(f)
            assert config is not None, "YAML should parse successfully"
        except yaml.YAMLError as e:
            pytest.fail(f"Invalid YAML syntax: {e}")
    
    def test_dependabot_has_version(self, dependabot_config):
        """Test that version field is present and correct"""
        assert 'version' in dependabot_config, "version field is required"
        assert dependabot_config['version'] == 2, "version should be 2"
    
    def test_dependabot_has_updates(self, dependabot_config):
        """Test that updates field exists and is a list"""
        assert 'updates' in dependabot_config, "updates field is required"
        assert isinstance(dependabot_config['updates'], list), "updates should be a list"
        assert len(dependabot_config['updates']) > 0, "updates should not be empty"
    
    def test_dependabot_npm_ecosystem(self, dependabot_config):
        """Test that npm ecosystem is configured"""
        npm_configs = [u for u in dependabot_config['updates'] 
                       if u.get('package-ecosystem') == 'npm']
        assert len(npm_configs) > 0, "npm ecosystem should be configured"
        
        npm_config = npm_configs[0]
        assert npm_config['directory'] == '/', "npm should monitor root directory"
        assert 'schedule' in npm_config, "npm should have schedule"
        assert npm_config['schedule']['interval'] == 'weekly', "npm should run weekly"
    
    def test_dependabot_pip_ecosystem(self, dependabot_config):
        """Test that pip ecosystem is configured"""
        pip_configs = [u for u in dependabot_config['updates'] 
                       if u.get('package-ecosystem') == 'pip']
        assert len(pip_configs) > 0, "pip ecosystem should be configured"
        
        pip_config = pip_configs[0]
        assert pip_config['directory'] == '/backend', "pip should monitor backend directory"
        assert 'schedule' in pip_config, "pip should have schedule"
    
    def test_dependabot_github_actions_ecosystem(self, dependabot_config):
        """Test that github-actions ecosystem is configured"""
        actions_configs = [u for u in dependabot_config['updates'] 
                          if u.get('package-ecosystem') == 'github-actions']
        assert len(actions_configs) > 0, "github-actions ecosystem should be configured"
    
    def test_dependabot_docker_ecosystems(self, dependabot_config):
        """Test that docker ecosystems are configured"""
        docker_configs = [u for u in dependabot_config['updates'] 
                         if u.get('package-ecosystem') == 'docker']
        assert len(docker_configs) >= 2, "docker should be configured for multiple directories"
        
        directories = [d['directory'] for d in docker_configs]
        assert '/' in directories, "docker should monitor root directory"
        assert '/backend' in directories, "docker should monitor backend directory"
    
    def test_dependabot_all_have_schedules(self, dependabot_config):
        """Test that all update configs have valid schedules"""
        for update in dependabot_config['updates']:
            assert 'schedule' in update, f"Update {update.get('package-ecosystem')} should have schedule"
            schedule = update['schedule']
            assert 'interval' in schedule, "schedule should have interval"
            assert schedule['interval'] in ['daily', 'weekly', 'monthly'], \
                f"Invalid interval: {schedule['interval']}"
    
    def test_dependabot_all_have_labels(self, dependabot_config):
        """Test that all update configs have labels"""
        for update in dependabot_config['updates']:
            assert 'labels' in update, f"Update {update.get('package-ecosystem')} should have labels"
            assert isinstance(update['labels'], list), "labels should be a list"
            assert 'dependencies' in update['labels'], "dependencies label should be present"
    
    def test_dependabot_valid_package_ecosystems(self, dependabot_config):
        """Test that only valid package ecosystems are used"""
        valid_ecosystems = {
            'npm', 'pip', 'github-actions', 'docker', 'bundler', 
            'cargo', 'composer', 'gradle', 'maven', 'nuget'
        }
        for update in dependabot_config['updates']:
            ecosystem = update.get('package-ecosystem')
            assert ecosystem in valid_ecosystems, \
                f"Invalid package-ecosystem: {ecosystem}"


class TestWorkflowConfiguration:
    """Test suite for .github/workflows/pipelines.yaml validation"""
    
    @pytest.fixture
    def workflow_path(self):
        """Fixture providing path to pipelines workflow"""
        repo_root = Path(__file__).parent.parent.parent
        return repo_root / ".github" / "workflows" / "pipelines.yaml"
    
    @pytest.fixture
    def workflow_config(self, workflow_path):
        """Fixture loading workflow configuration"""
        with open(workflow_path, 'r') as f:
            return yaml.safe_load(f)
    
    def test_workflow_file_exists(self, workflow_path):
        """Test that pipelines.yaml file exists"""
        assert workflow_path.exists(), "pipelines.yaml should exist"
    
    def test_workflow_valid_yaml(self, workflow_path):
        """Test that pipelines.yaml is valid YAML"""
        try:
            with open(workflow_path, 'r') as f:
                config = yaml.safe_load(f)
            assert config is not None, "YAML should parse successfully"
        except yaml.YAMLError as e:
            pytest.fail(f"Invalid YAML syntax: {e}")
    
    def test_workflow_has_name(self, workflow_config):
        """Test that workflow has a name"""
        assert 'name' in workflow_config, "workflow should have a name"
        assert isinstance(workflow_config['name'], str), "name should be a string"
    
    def test_workflow_has_jobs(self, workflow_config):
        """Test that workflow has jobs defined"""
        assert 'jobs' in workflow_config, "workflow should have jobs"
        assert isinstance(workflow_config['jobs'], dict), "jobs should be a dictionary"
        assert len(workflow_config['jobs']) > 0, "workflow should have at least one job"
    
    def test_workflow_docker_tags_no_lowercase_step(self, workflow_path):
        """Test that lowercase conversion step has been removed (as per diff)"""
        with open(workflow_path, 'r') as f:
            content = f.read()
        
        assert 'Convert to lowercase' not in content, \
            "Lowercase conversion step should be removed"
        assert "tr '[:upper:]' '[:lower:]'" not in content, \
            "Lowercase conversion logic should be removed"
        assert 'steps.lowercase.outputs' not in content, \
            "References to lowercase step outputs should be removed"
    
    def test_workflow_docker_tags_use_direct_variables(self, workflow_path):
        """Test that Docker tags use direct GitHub variables"""
        with open(workflow_path, 'r') as f:
            content = f.read()
        
        assert 'github.repository_owner' in content, \
            "Should use github.repository_owner directly"
        assert 'github.event.repository.name' in content, \
            "Should use github.event.repository.name directly"
    
    def test_workflow_docker_buildx_step_label(self, workflow_path):
        """Test that Docker Buildx step has correct emoji (as per diff)"""
        with open(workflow_path, 'r') as f:
            content = f.read()
        
        assert '🐳 Set up Docker Buildx' in content, \
            "Docker Buildx step should have correct emoji"
    
    def test_workflow_jobs_have_runs_on(self, workflow_config):
        """Test that all jobs specify runs-on"""
        for job_name, job_config in workflow_config['jobs'].items():
            assert 'runs-on' in job_config, \
                f"Job {job_name} should specify runs-on"
    
    def test_workflow_jobs_have_steps(self, workflow_config):
        """Test that all jobs have steps"""
        for job_name, job_config in workflow_config['jobs'].items():
            assert 'steps' in job_config, \
                f"Job {job_name} should have steps"
            assert isinstance(job_config['steps'], list), \
                f"Job {job_name} steps should be a list"


class TestWorkflowDeletion:
    """Test suite to verify removed workflow is gone"""
    
    def test_gitlab_mirror_workflow_removed(self):
        """Test that gitlab-mirror.yaml has been deleted"""
        repo_root = Path(__file__).parent.parent.parent
        gitlab_mirror_path = repo_root / ".github" / "workflows" / "gitlab-mirror.yaml"
        
        assert not gitlab_mirror_path.exists(), \
            "gitlab-mirror.yaml should be deleted"


class TestReadmeDocumentation:
    """Test suite for README.md validation"""
    
    @pytest.fixture
    def readme_path(self):
        """Fixture providing path to README"""
        repo_root = Path(__file__).parent.parent.parent
        return repo_root / "README.md"
    
    @pytest.fixture
    def readme_content(self, readme_path):
        """Fixture loading README content"""
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def test_readme_exists(self, readme_path):
        """Test that README.md exists"""
        assert readme_path.exists(), "README.md should exist"
    
    def test_readme_not_empty(self, readme_content):
        """Test that README is not empty"""
        assert len(readme_content.strip()) > 0, "README should not be empty"
        assert len(readme_content) > 100, "README should have substantial content"
    
    def test_readme_has_title(self, readme_content):
        """Test that README has a title"""
        lines = readme_content.split('\n')
        has_title = any(line.startswith('# ') for line in lines)
        assert has_title, "README should have a level 1 heading"
    
    def test_readme_milestone_structure(self, readme_content):
        """Test that README contains milestone structure (as per diff)"""
        assert '## Project Milestones' in readme_content, \
            "README should have Project Milestones section"
        
        assert 'Milestone 1' in readme_content, "Should have Milestone 1"
        assert 'Milestone 2' in readme_content, "Should have Milestone 2"
        assert 'Milestone 3' in readme_content, "Should have Milestone 3"
        assert 'Milestone 4' in readme_content, "Should have Milestone 4"
    
    def test_readme_has_future_roadmap(self, readme_content):
        """Test that README includes future roadmap section"""
        assert 'Future Roadmap' in readme_content, \
            "README should have Future Roadmap section"
    
    def test_readme_milestone_status_indicators(self, readme_content):
        """Test that milestones have status indicators"""
        status_indicators = ['*Complete*', '*Active*', '*In Progress*']
        has_status = any(indicator in readme_content for indicator in status_indicators)
        assert has_status, "Milestones should have status indicators"
    
    def test_readme_has_tech_stack_section(self, readme_content):
        """Test that README has Tech Stack section"""
        assert '## Tech Stack' in readme_content, \
            "README should have Tech Stack section"
    
    def test_readme_valid_markdown_links(self, readme_content):
        """Test that markdown links are properly formatted"""
        link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
        links = re.findall(link_pattern, readme_content)
        
        for text, url in links:
            assert len(text.strip()) > 0, "Link text should not be empty"
            assert len(url.strip()) > 0, "Link URL should not be empty"
    
    def test_readme_valid_headers(self, readme_content):
        """Test that markdown headers are properly formatted"""
        lines = readme_content.split('\n')
        
        for i, line in enumerate(lines):
            if line.startswith('#'):
                hash_count = len(line) - len(line.lstrip('#'))
                assert 1 <= hash_count <= 6, \
                    f"Invalid header level on line {i+1}"
                
                if len(line) > hash_count:
                    assert line[hash_count] == ' ', \
                        f"Header should have space after # on line {i+1}"
    
    def test_readme_table_structure(self, readme_content):
        """Test that tables are properly formatted"""
        lines = readme_content.split('\n')
        
        in_table = False
        table_column_count = None
        
        for i, line in enumerate(lines):
            if '|' in line:
                columns = len([c for c in line.split('|') if c.strip()])
                
                if not in_table:
                    in_table = True
                    table_column_count = columns
                else:
                    if not all(c in '|-: ' for c in line):
                        assert columns == table_column_count, \
                            f"Inconsistent column count on line {i+1}"
            else:
                in_table = False
                table_column_count = None
    
    def test_readme_no_old_features_section(self, readme_content):
        """Test that old Features section structure is replaced with Milestones"""
        lines = readme_content.split('\n')
        
        features_section_idx = None
        for i, line in enumerate(lines):
            if '## Features' in line:
                features_section_idx = i
                break
        
        if features_section_idx is not None:
            section_content = '\n'.join(lines[features_section_idx:features_section_idx+20])
            assert '### ✅ Implemented' not in section_content, \
                "Old Features section format should be replaced"
    
    def test_readme_key_sections_present(self, readme_content):
        """Test that all key sections are present"""
        required_sections = ['## Project Milestones', '## Tech Stack']
        
        for section in required_sections:
            assert section in readme_content, \
                f"README should contain '{section}' section"
    
    def test_readme_encoding_utf8(self, readme_path):
        """Test that README uses UTF-8 encoding"""
        try:
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()
            assert len(content) > 0, "README should be readable as UTF-8"
        except UnicodeDecodeError:
            pytest.fail("README should use UTF-8 encoding")


class TestConfigurationConsistency:
    """Test suite for consistency across configuration files"""
    
    @pytest.fixture
    def repo_root(self):
        """Fixture providing repository root path"""
        return Path(__file__).parent.parent.parent
    
    def test_docker_directories_consistency(self, repo_root):
        """Test that Docker directories in dependabot match actual Dockerfiles"""
        dependabot_path = repo_root / ".github" / "dependabot.yml"
        
        with open(dependabot_path, 'r') as f:
            dependabot_config = yaml.safe_load(f)
        
        docker_configs = [u for u in dependabot_config['updates'] 
                         if u.get('package-ecosystem') == 'docker']
        docker_dirs = {d['directory'] for d in docker_configs}
        
        for docker_dir in docker_dirs:
            actual_dir = repo_root if docker_dir == '/' else repo_root / docker_dir.lstrip('/')
            
            dockerfile_path = actual_dir / "Dockerfile"
            has_dockerfile = dockerfile_path.exists() or \
                           len(list(actual_dir.glob("**/Dockerfile"))) > 0
            
            assert has_dockerfile, \
                f"Directory {docker_dir} monitored by dependabot should contain Dockerfile"
    
    def test_npm_directory_has_package_json(self, repo_root):
        """Test that npm monitoring directory contains package.json"""
        dependabot_path = repo_root / ".github" / "dependabot.yml"
        
        with open(dependabot_path, 'r') as f:
            dependabot_config = yaml.safe_load(f)
        
        npm_configs = [u for u in dependabot_config['updates'] 
                       if u.get('package-ecosystem') == 'npm']
        
        for npm_config in npm_configs:
            npm_dir = npm_config['directory']
            actual_dir = repo_root if npm_dir == '/' else repo_root / npm_dir.lstrip('/')
            
            package_json_path = actual_dir / "package.json"
            assert package_json_path.exists(), \
                f"npm directory {npm_dir} should contain package.json"
    
    def test_pip_directory_has_requirements(self, repo_root):
        """Test that pip monitoring directory contains requirements file"""
        dependabot_path = repo_root / ".github" / "dependabot.yml"
        
        with open(dependabot_path, 'r') as f:
            dependabot_config = yaml.safe_load(f)
        
        pip_configs = [u for u in dependabot_config['updates'] 
                       if u.get('package-ecosystem') == 'pip']
        
        for pip_config in pip_configs:
            pip_dir = pip_config['directory']
            actual_dir = repo_root if pip_dir == '/' else repo_root / pip_dir.lstrip('/')
            
            has_python_deps = (actual_dir / "requirements.txt").exists() or \
                             (actual_dir / "setup.py").exists() or \
                             (actual_dir / "pyproject.toml").exists()
            
            assert has_python_deps, \
                f"pip directory {pip_dir} should contain Python dependency file"


class TestYAMLBestPractices:
    """Test suite for YAML formatting and best practices"""
    
    @pytest.fixture
    def yaml_files(self):
        """Fixture providing all YAML files in .github"""
        repo_root = Path(__file__).parent.parent.parent
        github_dir = repo_root / ".github"
        
        yaml_files = []
        yaml_files.extend(github_dir.glob("*.yaml"))
        yaml_files.extend(github_dir.glob("*.yml"))
        if (github_dir / "workflows").exists():
            yaml_files.extend((github_dir / "workflows").glob("*.yaml"))
            yaml_files.extend((github_dir / "workflows").glob("*.yml"))
        
        return yaml_files
    
    def test_yaml_files_use_spaces_not_tabs(self, yaml_files):
        """Test that YAML files use spaces for indentation"""
        for yaml_file in yaml_files:
            with open(yaml_file, 'r') as f:
                content = f.read()
            
            assert '\t' not in content, \
                f"{yaml_file.name} should use spaces, not tabs"
    
    def test_yaml_files_consistent_indentation(self, yaml_files):
        """Test that YAML files use consistent indentation (2 spaces)"""
        for yaml_file in yaml_files:
            with open(yaml_file, 'r') as f:
                lines = f.readlines()
            
            for i, line in enumerate(lines):
                if line.strip() and not line.strip().startswith('#'):
                    leading_spaces = len(line) - len(line.lstrip(' '))
                    
                    if leading_spaces > 0:
                        assert leading_spaces % 2 == 0, \
                            f"{yaml_file.name} line {i+1} has inconsistent indentation"
    
    def test_yaml_files_end_with_newline(self, yaml_files):
        """Test that YAML files end with newline"""
        for yaml_file in yaml_files:
            with open(yaml_file, 'rb') as f:
                content = f.read()
            
            if len(content) > 0:
                assert content.endswith(b'\n'), \
                    f"{yaml_file.name} should end with newline"