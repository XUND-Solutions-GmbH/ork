# _ork_ application

The web part of _ork_ is a typescript node.js application. The available GET APIs provide information on possible permissions for `:area` and `:target`:

- `/api/v1/areas/:area/targets/:target/authorizations`
- `/api/v1/areas/:area/authorizations`

Permissions can be set via the POST endpoint:

- `/areas/:area/targets/:target/authorizations` by providing the payload as follows: `{"permission" : permission_name}`. Additional info can be provided via the context field: `{"permission" : permission_name, "context":{"serialNumber" : macserial}}`

The application expects to receive the username from [vouch](https://github.com/vouch/vouch-proxy) authentication proxy, which passes it in the `x-vouch-user` header. Other header can be used by adjusting the `userHeaderName` config value.

## Configuration

Configuration happens via the `accessConfig.json` file that needs to be under the `/home/node/ork/backend/` path. There are 3 main sections:

### Chains

Here you define how to evaluate and authorize access to various targets.

```json
{
"chains": [
    {
      "area": "kubernetes",
      "authorizer": "kubernetes",
      "evaluators": ["rolebinding", "mosyle"]
    }
  ]
}
```

### Rolebinding config

Here you can define which user is allowed to be bound to what role and cluster role. In the below example, user1 can get the security role in the dev cluster and the cluster-reader in the stage cluster.
 
```json 
{
"maxExpiryHours": 12,
"rolebindings": [
    {
    "user": "user1@example.com",
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
```

For environments you want to control, _ork_ will check either use the `CLUSTERS` environment variable or read available kubeconfigs.
You need to add the kubeconfig files for the respective environments to the home/.kube folder with the name format config-_{environment}_ and update the Dockerfile to copy these into the image. _ork_ will search for these files in this format when creating bindings.

### Mosyle device management config

Here you can enforce that only devices in your device management can access particular areas and under that clusters. You need to provide the credentials to access the Mosyle API via the env variables MOSYLE_ACCESS_TOKEN, MOSYLE_USER, MOSYLE_PASS.

```json
"mosyleEnforcement": [
    {
      "area":"kubernetes",
      "targets":[
        "utility",
        "class2"
      ]
    }
  ],
```

## Build

To build the application, run `yarn build` and to create the docker image run `docker build .`. The accessConfig and the respective kubeconfig files are copied into the image as part of the build.

## Run

To run the application start the docker image and expose port 8080.
