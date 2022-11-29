
import pickle
import sys

with open(r"model.pkl", "rb") as input_file:
  m = pickle.load(input_file)

print(m.predict([sys.argv]))