import json
from pathlib import Path
import numpy as np
from PIL import Image
folder=Path(__file__).parent
im=np.array(Image.open(folder/'s3-near-sheet.png').convert('RGB'),dtype=np.int16)
edge=np.max(np.abs(np.diff(im,axis=1)),axis=2)>=10
lit=im[:,:,0].astype(float)*.2126+im[:,:,1]*.7152+im[:,:,2]*.0722>=25
widths=[]
for row,dark in zip(edge,~lit[:,1:]):
    marks=np.r_[-1,np.where(row|dark)[0],im.shape[1]-1]
    widths.extend(np.diff(marks).tolist())
rows=np.array(widths)
dwarf=np.array(Image.open(folder/'s3-dwarf.png').convert('RGB'))
near=dwarf[500:580,920:1000].astype(int)
ice=(near[:,:,0]>135)&(near[:,:,1]>195)&(near[:,:,2]>195)
yy,xx=np.where(ice)
result={'width':im.shape[1],'height':im.shape[0],'flatRunMaxPixels':int(rows.max()),'flatRun99thPercentile':float(np.percentile(rows,99)),
        'dwarfBrightCoreAndRaysPixels':int(yy.max()-yy.min()+1) if len(yy) else 0}
(folder/'s3-detail.json').write_text(json.dumps(result,indent=2))
print(result)
