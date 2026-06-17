import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        tree = ET.XML(docx.read('word/document.xml'))
    
    WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    PARA = WORD_NAMESPACE + 'p'
    TEXT = WORD_NAMESPACE + 't'
    
    paragraphs = []
    for paragraph in tree.iter(PARA):
        texts = [node.text for node in paragraph.iter(TEXT) if node.text]
        if texts:
            paragraphs.append(''.join(texts))
    return '\n'.join(paragraphs)

if __name__ == '__main__':
    text = extract_text_from_docx(r'c:\Users\Zac\Documents\Antigravity\zaja10.github.io\CV - ALDISS Zachary 2026.docx')
    with open('cv_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
