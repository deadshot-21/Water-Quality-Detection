
import pickle
import sys

# with open('model.p', "rb") as input_file:
#   m = pickle.load(input_file)
filename = 'model.pkl'
m = pickle.load(open(filename, 'rb'))

print(m.predict([sys.argv]))