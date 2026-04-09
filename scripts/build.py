#!/usr/bin/env python3
"""Build script: reads YAML content files and generates JSON for the PWA."""

import hashlib
import json
import os
import sys

import yaml


def load_content_files(content_dir):
    """Load all content YAML files from directory, skipping index.yaml."""
    pieces = []
    if not os.path.isdir(content_dir):
        return pieces
    for filename in sorted(os.listdir(content_dir)):
        if not filename.endswith('.yaml') or filename == 'index.yaml':
            continue
        filepath = os.path.join(content_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        if data:
            pieces.append(data)
    return pieces


def load_techniques(registry_path):
    """Load technique registry from YAML file."""
    with open(registry_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data.get('techniques', [])


def build_content_json(pieces):
    """Convert content pieces to PWA-ready JSON (strips verification data)."""
    output = []
    for piece in pieces:
        entry = {k: v for k, v in piece.items() if k != 'verification'}
        if 'content_zh' in entry:
            entry['content_zh'] = entry['content_zh'].strip()
        output.append(entry)
    return output


def build_techniques_json(techniques):
    """Convert techniques list to PWA-ready JSON."""
    return list(techniques)


def compute_content_hash(content_zh):
    """Compute SHA256 hash of Chinese content text."""
    return hashlib.sha256(content_zh.strip().encode('utf-8')).hexdigest()


def update_index(pieces):
    """Generate index entries for deduplication."""
    entries = []
    for piece in pieces:
        content_zh = piece.get('content_zh', '').strip()
        first_line = content_zh.split('\n')[0].strip() if content_zh else ''
        entries.append({
            'id': piece['id'],
            'author': piece.get('author', ''),
            'source': piece.get('source', {}).get('book', ''),
            'content_hash': compute_content_hash(content_zh),
            'first_line': first_line,
        })
    return entries


def main():
    """Main build: read YAML sources, write JSON to site/data/."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    content_dir = os.path.join(project_root, 'content')
    techniques_path = os.path.join(project_root, 'techniques', 'registry.yaml')
    output_dir = os.path.join(project_root, 'site', 'data')
    index_path = os.path.join(content_dir, 'index.yaml')

    # Load
    pieces = load_content_files(content_dir)
    techniques = load_techniques(techniques_path)

    # Build JSON for PWA
    content_json = build_content_json(pieces)
    techniques_json = build_techniques_json(techniques)

    # Write JSON output
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, 'content.json'), 'w', encoding='utf-8') as f:
        json.dump(content_json, f, ensure_ascii=False, indent=2)
    with open(os.path.join(output_dir, 'techniques.json'), 'w', encoding='utf-8') as f:
        json.dump(techniques_json, f, ensure_ascii=False, indent=2)

    # Update dedup index
    index_entries = update_index(pieces)
    with open(index_path, 'w', encoding='utf-8') as f:
        yaml.dump({'entries': index_entries}, f, allow_unicode=True, default_flow_style=False)

    print(f"Built {len(content_json)} content pieces, {len(techniques_json)} techniques")
    print(f"Output: {output_dir}")
    print(f"Index updated: {index_path}")


if __name__ == '__main__':
    main()
