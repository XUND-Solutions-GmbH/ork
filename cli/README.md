# ork cli client

## Setup for Mac
Download project and run setup. This will download dependencies and set orkclient into path. 
> sudo ./orksetup.sh

## ork connection
After setup you can use following command for CLI to ork (does creation of binding).
> orkclient -h

## Preparation
The client is configured to talk to a vouch proxy that sits in front the ork web application. It calls its login url and sets the return url to a locally opened port to get the vouch cookie. For other authentication, the cli needs to be adopted.

The list of possible clusters to talk to needs to be updated in the k8s_envs variable.

usage: orkclient [-b] [-s] [-v VOUCH_COOKIE] [-k K8S_CLUSTER] 

optional arguments:  
  -h               show this help message and exit
  -b               start browser for login  
  -s               only setup hosts file but dont start authz flow  
  -v VOUCH_COOKIE  vouch cookie value to use for authentication 
  -k K8S_CLUSTER   k8s cluster to connect to, one of: ['dev']

<pre>
                    .-#%%##%#=.
                    +%*==+=++#%.  #-
                    :@=========+% -@@:
                :@+*%=%+=**====*+#+%#
                +##+#**%=@*=+#====*+=+@+
    -*###+:  *%=+*#*%***+=====+**##=
    +#****#%:  +@*==============#-
    @******##   .+%%*++*#*======%=
    =#******%      .-%#*+======+@:
    -#*****%-      +#+*+*+++==%%         ---:
        +#***##     *#==+=====*%@-.      ***#=*
        .+#**%:.   +%**+**#%@@%##%#=   .+++#**-
            .##%*+*.  .=#%%@%#####%#%## :#%#*#*=
            :++%=*+@#####%%@######%%#%%%###%@:
            -**###%%%%%%*%########%%%%%%%%+.
            .-#@===-: +%############%+.
                =:     #%##########%#+
                        =#%#-----@#%-
                        %#%*    -@%%*

</pre>