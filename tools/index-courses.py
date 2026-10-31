"""Read the external course library without modifying it; rebuild the local index."""
from pathlib import Path
import json
import re
import sys

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/Users/yorick/Documents/code/luren-master')
output = Path(__file__).resolve().parents[1] / 'content/course-index.json'
lessons = []
for document in (source / 'document').glob('*.md'):
    match = re.match(r'(\d+)\.(.*)', document.stem)
    if not match:
        continue
    number, title = int(match[1]), match[2]
    ranking = number == 64 and 'Redis' in title
    module = f'lesson{65 if ranking else number:03}'
    item = {
        'id': number, 'key': str(number) + ('-ranking' if ranking else ''),
        'title': title, 'document': str(document.relative_to(source)),
        'module': module if (source / module).is_dir() else None,
        'status': '待学习'
    }
    if ranking:
        item['note'] = '原文编号64，与二维码重复；根据UserRankingController核对到lesson065。'
    lessons.append(item)
lessons.sort(key=lambda item: (item['id'], item['key']))
assert len({item['key'] for item in lessons}) == len(lessons), 'Duplicate document keys require manual review'
output.write_text(json.dumps(lessons, ensure_ascii=False, indent=2) + '\n')
print(f'Indexed {len(lessons)} documents; original files unchanged.')
