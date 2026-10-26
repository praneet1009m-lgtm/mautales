import sys;from PIL import Image
fs=sys.argv[2:];out=sys.argv[1];W=720;H=450
c=Image.new('RGB',(W*2,H*((len(fs)+1)//2)))
for i,f in enumerate(fs):c.paste(Image.open('shots/'+f).convert('RGB').resize((W,H)),((i%2)*W,(i//2)*H))
c.save(out)
