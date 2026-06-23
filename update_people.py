import re

with open('people.html', 'r', encoding='utf-8') as f:
    text = f.read()

# remove faculty nav-link
text = text.replace('<a href="#faculty" class="nav-link active">Faculty</a>\n    <a href="#graduate"', '<a href="#graduate" class="nav-link active"')
# remove faculty filter-btn
text = text.replace('<button class="mobile-filter-btn active" data-filter="faculty">Faculty</button>\n      <button class="mobile-filter-btn"', '<button class="mobile-filter-btn active" data-filter="graduate"')

# remove the Faculty section entirely
section_pattern = re.compile(r'<!-- Faculty -->.*?<!-- Graduate Students -->', re.DOTALL)
text = section_pattern.sub('<!-- Graduate Students -->', text)

with open('people.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('people.html updated')
