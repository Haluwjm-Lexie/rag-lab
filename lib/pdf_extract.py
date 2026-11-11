import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "vendor"))
# ASCII JSON is portable even when Windows stdout uses GBK or an ASCII code page.
def emit(data):
    print(json.dumps(data, ensure_ascii=True))
if sys.version_info < (3,9):
    emit({'error':'PDF解析需要Python 3.9或以上版本，请更新Python后重试。','code':'PYTHON_VERSION'});sys.exit(2)
try:
    from pypdf import PdfReader
except ImportError:
    emit({'error':'尚未安装 PDF 解析组件 pypdf。请双击程序文件夹里的“安装PDF支持.bat”，安装完成后重新选择 PDF。已有教学资料不受影响。','code':'PDF_DEPENDENCY'});sys.exit(2)
if len(sys.argv)>1 and sys.argv[1]=='--check':
    emit({'ok':True,'python':sys.version.split()[0]});sys.exit(0)
try:
    reader=PdfReader(sys.argv[1]);parts=[]
    if len(reader.pages)>500: raise ValueError('超过500页，请拆分后导入')
    if reader.is_encrypted: raise ValueError('文件有密码，请先另存为无密码PDF')
    for i,p in enumerate(reader.pages):
        parts.append('[第%d页]\n%s' % (i+1,p.extract_text() or ''))
    if sum(len(s.strip()) for s in parts)<len(parts)*12: raise ValueError('没有提取到足够正文，可能是扫描件。请先做OCR，或粘贴可复制的文字。')
    emit({'text':'\n\n'.join(parts),'pages':len(reader.pages)})
except Exception as e:
    emit({'error':'PDF 解析未成功：'+str(e),'code':'PDF_PARSE'});sys.exit(2)
