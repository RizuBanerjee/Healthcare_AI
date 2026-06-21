import os
import random
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

base = "datasets/pad_ufes_20/images"

samples = df.sample(9)

plt.figure(figsize=(10,10))

for i, (_, row) in enumerate(samples.iterrows()):

    img_name = row["img_id"]

    path = None

    for part in ["imgs_part_1", "imgs_part_2", "imgs_part_3"]:
        p = os.path.join(base, part, img_name)

        if os.path.exists(p):
            path = p
            break

    img = Image.open(path)

    plt.subplot(3,3,i+1)
    plt.imshow(img)
    plt.title(row["diagnostic"])
    plt.axis("off")

plt.tight_layout()
plt.show()