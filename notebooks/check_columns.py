import pandas as pd

df = pd.read_csv("datasets/disease_symptoms/Training.csv")

print(df.columns.tolist())
print("Total columns:", len(df.columns))