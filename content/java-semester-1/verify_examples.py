"""Compile and execute every published example, without writing .class into the package."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile
import zipfile
from lessons import WEEKS

ROOT=Path(__file__).resolve().parent

def main():
    java_home=Path(os.environ['JAVA_HOME']) if os.getenv('JAVA_HOME') else None
    def exe(name):
        path=java_home/'bin'/(name+'.exe' if os.name=='nt' else name) if java_home else shutil.which(name)
        if not path:raise RuntimeError(name+' not found')
        return str(path)
    results=[]
    with tempfile.TemporaryDirectory(prefix='java-semester-check-') as tmp:
        files=[str(ROOT/'student'/'examples'/f'Week{w["week"]:02d}.java') for w in WEEKS]
        subprocess.run([exe('javac'),'--release','21','-encoding','UTF-8','-d',tmp,*files],check=True,capture_output=True,text=True)
        for w in WEEKS:
            name=f'Week{w["week"]:02d}'
            result=subprocess.run([exe('java'),'-cp',tmp,name],cwd=tmp,check=True,capture_output=True,text=True,encoding='utf-8',timeout=10)
            assert result.stdout.strip()==w['output'],(name,result.stdout,w['output'])
            results.append(dict(example=name,status='passed',expectedOutput=w['output']))
    package=json.loads((ROOT/'course.json').read_text(encoding='utf-8'))
    for q in package['questions']:
        assert len(q['options'])==len(set(q['options']))
        assert q['correctAnswer'] in q['options']
    assert len({q['key'] for q in package['questions']})==60
    with zipfile.ZipFile(ROOT/'student-package.zip') as archive:
        names=archive.namelist()
        assert len([n for n in names if n.endswith('.java')])==15
        assert not any('instructor' in n or 'answer-key' in n or n.endswith('.class') for n in names)
    (ROOT/'verification.json').write_text(json.dumps(dict(javaRelease=21,examples=results,questionValidation='60 passed',studentArchive='15 Java sources; no answer key or compiled classes'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PASS: 15 Java examples compiled and matched expected output; 60 questions validated; student archive checked.')

if __name__=='__main__':main()
