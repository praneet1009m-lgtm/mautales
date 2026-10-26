import json,hashlib,os
from PIL import Image
m=json.load(open('public/turn/manifest.json'))
for s in m:
    d='public/turn/'+s['id'];seen={};new={}
    for K,e in s['snaps'].items():
        p=d+'/'+e['f'];im=Image.open(p);W=im.size[0];x=0
        one=K in('#momentsexit','#aboutexit')
        if not s['mobile'] and not one:
            half=W//2
            if K.endswith('exit'): im=im.crop((half,0,W,im.size[1]));x=s['w']/2
            else: im=im.crop((0,0,half+2,im.size[1]))
        h=hashlib.md5(im.tobytes()).hexdigest()+str(x)
        if h in seen: new[K]=dict(seen[h]);continue
        f='%d.webp'%len(seen);im.save(d+'/n'+f,quality=82,method=6)
        seen[h]={'f':f,'h':e['h'],'x':x};new[K]=dict(seen[h])
    for f in os.listdir(d):
        if not f.startswith('n'): os.remove(d+'/'+f)
    for f in os.listdir(d): os.rename(d+'/'+f,d+'/'+f[1:])
    s['snaps']=new;s['dpr']=1.5
json.dump(m,open('public/turn/manifest.json','w'))
