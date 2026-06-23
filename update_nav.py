import os
import glob
import re

html_files = glob.glob('*.html')
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # match `<li ...>Home</li>` and `<li ...>Team</li>`
    nav_pattern = r'(<li class="nav-item"><a class="nav-link.*?" href="index\.html">Home</a></li>\s*)<li class="nav-item"><a class="nav-link(.*?)" href="people\.html">Team</a></li>'
    
    def repl(m):
        home_li = m.group(1)
        people_active_cls = m.group(2) # " active" or ""
        
        return f'{home_li}<li class="nav-item"><a class="nav-link" href="faculty.html">Faculty</a></li>\n          <li class="nav-item"><a class="nav-link{people_active_cls}" href="people.html">Researchers</a></li>'

    new_content = re.sub(nav_pattern, repl, content)
    
    # Update page titles for people.html
    if file == 'people.html':
        new_content = new_content.replace('<title>Team</title>', '<title>Researchers</title>')
        new_content = new_content.replace('<h2 class="fw-bold mb-3">Our Team</h2>', '<h2 class="fw-bold mb-3">Our Researchers</h2>')
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Updated {len(html_files)} files.")
