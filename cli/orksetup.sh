#! /bin/bash

set -e

python3 -m venv /usr/local/lib/ork-cli && source /usr/local/lib/ork-cli/bin/activate
echo "$(echo '#!'"$(which python3)" | cat - orkclient.py)" >orkclient-temp.py
python3 -m pip install requests==2.28.1
cp orkclient-temp.py /usr/local/bin/orkclient
chmod a+x /usr/local/bin/orkclient
rm orkclient-temp.py
orkclient -s
