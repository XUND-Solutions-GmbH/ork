# ork (On-demand Rolebinding for Kubernetes)
ork allows users of a Kubernetes cluster to work with minimal privileges during their daily activity and only escalate their role when needed. The ork web application has the permission to create bindings, and uses the RBAC roles defined within the cluster to bind it to requesting users. Based on the configuration, bindings are destroyed after a set amount of time. Our goal with ork is to provide a flexible tool that can be utilized in many different ways.

## Usage
ork has three main building blocks:
- The web application serves to handle communication with the Kubernetes cluster. It creates and destroys role and cluster role bindings. It provides a very simple API interface to interact with. Instructions to configure, build, and run the application are in the `application` folder.
- The `deploy` folder holds the Kubernetes manifests needed to connect your ork application instance with your cluster. It creates the needed service account, assignes needed permissions, and creates a secret which can be added to the web application's kube config.
- For easy interaction with the web application, there is a python based cli. It allows to query possible bindings and request a new binding to be created. The code in the `cli` folder needs to be adopted to work with your deployment and authentication mechanism.


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