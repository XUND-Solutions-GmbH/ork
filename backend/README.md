# ork application
The web poart of ork is a typescript node.js application. The available APIs are:
- `/api/v1/userrolebindings` - to get roles and clusterroles available for a user based on config
- `/api/v1/clusters/:id/rolebindings/` - add role or rolebinding to `:id` cluster

The application expects to receive the username from [vouch](https://github.com/vouch/vouch-proxy) authentication proxy, which passes it in the `x-vouch-user` header.

## Configuration
Configuration happens via the `src/accessConfig.json` file. Here you can define which user is allowed to be bound to what role and cluster role. In the below example, user1 can get the security role in the dev cluster and the cluster-reader in the stage cluster.
    {
    "maxExpiryHours": 12,
    "rolebindings": [
        {
        "user": "user1@ork.io",
        "permissions": [
            {
            "clusters": ["dev"],
            "roleDefinitions": {
                "roles": ["security"],
                "clusterRoles": []
            }
            },
            {
            "clusters": ["stage"],
            "roleDefinitions": {
                "roles": [],
                "clusterRoles": ["cluster-reader"]
            }
            }
        ]
        }
    ]
    }

For environments you want to control, you need to update the environment list in the `kubernetesService.ts` file's `CLUSTER_LIST` variable. You also need to add the kubeconfig files for the respective environments to the kubeconfig folder with the name format _{environment}_-config and update the Dockerfile to copy these into the image. ork will search for these files in this format when creating bindings.

## Build
To build the application, run `yarn build` and to create the docker image run `docker build .`. The accessConfig and the respective kubeconfig files are copied into the image as part of the build.

## Run
To run the application start the docker image and expose port 8080.

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

