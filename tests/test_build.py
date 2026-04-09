import hashlib
import json
import os
import shutil
import tempfile

import pytest
import yaml

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from build import load_content_files, load_techniques, build_content_json, build_techniques_json, compute_content_hash, update_index


FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')


def load_fixture(name):
    with open(os.path.join(FIXTURES, name), 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


class TestLoadContent:
    def test_loads_yaml_files_from_directory(self, tmp_path):
        fixture = load_fixture('sample_content.yaml')
        (tmp_path / 'piece1.yaml').write_text(
            yaml.dump(fixture, allow_unicode=True), encoding='utf-8'
        )
        result = load_content_files(str(tmp_path))
        assert len(result) == 1
        assert result[0]['id'] == 'test-001'

    def test_skips_index_yaml(self, tmp_path):
        fixture = load_fixture('sample_content.yaml')
        (tmp_path / 'piece1.yaml').write_text(
            yaml.dump(fixture, allow_unicode=True), encoding='utf-8'
        )
        (tmp_path / 'index.yaml').write_text('entries: []', encoding='utf-8')
        result = load_content_files(str(tmp_path))
        assert len(result) == 1

    def test_empty_directory(self, tmp_path):
        result = load_content_files(str(tmp_path))
        assert result == []


class TestLoadTechniques:
    def test_loads_technique_registry(self):
        result = load_techniques(os.path.join(FIXTURES, 'sample_techniques.yaml'))
        assert len(result) == 2
        assert result[0]['id'] == 'personification'
        assert result[1]['id'] == 'reduplication'


class TestBuildContentJson:
    def test_produces_valid_json_structure(self):
        fixture = load_fixture('sample_content.yaml')
        result = build_content_json([fixture])
        assert isinstance(result, list)
        assert len(result) == 1
        piece = result[0]
        assert piece['id'] == 'test-001'
        assert piece['content_zh'].strip() == '这是一段测试内容。'
        assert piece['expression_patterns'][0]['technique_id'] == 'personification'

    def test_strips_verification_from_output(self):
        fixture = load_fixture('sample_content.yaml')
        result = build_content_json([fixture])
        assert 'verification' not in result[0]


class TestBuildTechniquesJson:
    def test_produces_valid_json_structure(self):
        techniques = load_fixture('sample_techniques.yaml')['techniques']
        result = build_techniques_json(techniques)
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]['id'] == 'personification'
        assert result[0]['name_zh'] == '拟人'


class TestComputeContentHash:
    def test_consistent_hash(self):
        text = "小草偷偷地从土里钻出来"
        h1 = compute_content_hash(text)
        h2 = compute_content_hash(text)
        assert h1 == h2
        assert len(h1) == 64

    def test_different_text_different_hash(self):
        h1 = compute_content_hash("文本一")
        h2 = compute_content_hash("文本二")
        assert h1 != h2


class TestUpdateIndex:
    def test_generates_index_entries(self):
        fixture = load_fixture('sample_content.yaml')
        result = update_index([fixture])
        assert len(result) == 1
        entry = result[0]
        assert entry['id'] == 'test-001'
        assert entry['author'] == '测试作者'
        assert entry['source'] == '测试书'
        assert 'content_hash' in entry
        assert entry['first_line'] == '这是一段测试内容。'
