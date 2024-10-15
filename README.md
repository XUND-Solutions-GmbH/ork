# ork (On-demand Rolebinding for Kubernetes)

[![Build ork application image](https://github.com/XUND-Solutions-GmbH/ork/actions/workflows/ork-app-build.yml/badge.svg)](https://github.com/XUND-Solutions-GmbH/ork/actions/workflows/ork-app-build.yml)

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

_ork_ allows users of a Kubernetes cluster to work with minimal privileges during their daily activity and only escalate their role when needed. The _ork_ web application has the permission to create bindings, and uses the RBAC roles defined within the cluster to bind it to requesting users. Based on the configuration, bindings are destroyed after a set amount of time. Our goal with _ork_ is to provide a flexible tool that can be utilized in many different ways.

## Usage

_ork_ has three main building blocks:

- The web application serves to handle communication with the Kubernetes cluster. It creates and destroys role and cluster role bindings. It provides a very simple API interface to interact with. Instructions to configure, build, and run the application are in the [application documentation](application/README.md).
- The [`deploy`](deploy/) folder holds the Kubernetes manifests needed to connect your _ork application_ instance with your cluster. It creates the needed _service account_, assignes needed permissions, and creates a secret which can be added to the web application's kube config.
- For easy interaction with the web application, there is a python based cli tool. It allows to query possible bindings and request a new binding to be created. The code in the [`cli`](cli/) folder needs to be adopted to work with your deployment and authentication mechanism.
