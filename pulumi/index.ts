import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Set the names of your resources
let vpcName = "myVPC";
let clusterName = "myCluster";
let sgName = "mySG"

// Create a new VPC
const vpc = new awsx.ec2.Vpc(vpcName, {});

// Create an ECS cluster using Fargate
const cluster = new aws.ecs.Cluster(clusterName, {
    
});

// Create a new Security Group with the given name.
let secGroup = new aws.ec2.SecurityGroup(sgName, {});


const alb = new awsx.lb.ApplicationLoadBalancer(
    "app-lb", { securityGroups: [ secGroup.id ] }
);
const listener = alb.createListener("app-listener", { port: 80, protocol: "HTTP" });
listener.createTargetGroup("app-tg", {
    port: 3000,
    targetType: "ip",
    healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
    },
}).createListenerRule("app-rule", {
    actions: [
        {
            type: "forward",
            targetGroupArn: listener.defaultTargetGroup.arn,
        },
    ],
    conditions: [
        {
            field: "path-pattern",
            values: "/*",
        },
    ],
});

// // Define the task
// const task = new awsx.ecs.FargateTaskDefinition("task", {
//     containers: {
//         app: {
//             name: "warmandcozy",
//             image: "philjim/warmandcozy:latest",
//             memory: 128 /* minimal memory in MiB */,
//             portMappings: [ { containerPort: 3000 } ],
//         },
//     },
// });

// // Define the service
// const service = new awsx.ecs.FargateService("service", {
//     cluster,
//     taskDefinition: task.taskDefinition.arn,
//     desiredCount: 1,
// });

// const logGroup = new aws.cloudwatch.LogGroup("LogGroup");

// // Outputs
// export const url = listener.endpoint.hostname;
