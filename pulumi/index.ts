import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Set the names of your resources
const vpcName = "myVPC";
const clusterName = "myCluster";
const sgName = "mySG";
const appName = "warmandcozy"; // Giving a clear name to the app for reference

// Create a new VPC
const vpc = new awsx.ec2.Vpc(vpcName, {});

// // Create an ECS cluster using Fargate
// const cluster = new aws.ecs.Cluster(clusterName, {});

// Create a Security Group for the ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(sgName, {
    vpcId: vpc.vpcId,
    description: "ALB security group",
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

// Create an Application Load Balancer
const alb = new aws.lb.LoadBalancer("app-lb", {
    loadBalancerType: "application",
    subnets: vpc.publicSubnetIds,
    securityGroups: [albSecurityGroup.id],
});

// Create a Security Group for the ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup("ecsSecurityGroup", {
    vpcId: vpc.vpcId,
    description: "ECS security group",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id], // Use the ALB security group
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

// // Create a Target Group for the Load Balancer
// const targetGroup = new aws.lb.TargetGroup("app-tg", {
//     port: 3000,
//     protocol: "HTTP",
//     targetType: "ip",
//     vpcId: vpc.vpcId,
// });

// // Create a Listener for the Load Balancer
// const httpListener = new aws.lb.Listener("http-listener", {
//     loadBalancerArn: alb.arn,
//     port: 80,
//     defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
// });

// // Define the task definition
// const task = new awsx.ecs.FargateTaskDefinition("task", {
//     // Note: For Fargate tasks, 'family' is not needed, and 'cpu' and 'memory' are defined at the container level
//     containers: {
//         [appName]: {
//             name: appName,
//             image: "philjim/warmandcozy:latest",
//             memory: 512,
//             portMappings: [{ containerPort: 3000, protocol: "tcp" }],
//             logConfiguration: {
//                 // Ensure you have a log configuration for debugging
//                 logDriver: "awslogs",
//                 options: {
//                     "awslogs-group": "/ecs/app", // Specify your CloudWatch Logs group
//                     "awslogs-region": "us-west-2", // Specify your AWS region
//                     "awslogs-stream-prefix": "ecs", // A prefix for the log streams
//                 },
//             },
//         },
//     },
// });

// // Define the service
// const service = new awsx.ecs.EC2Service("service", {
//     cluster: cluster.arn,
//     taskDefinition: task.taskDefinition.arn,
//     desiredCount: 1,
//     networkConfiguration: {
//         subnets: vpc.publicSubnetIds,
//         securityGroups: [ecsSecurityGroup.id],
//     },
//     loadBalancers: [{
//         targetGroupArn: targetGroup.arn,
//         containerName: appName, // match the name defined in the containers map
//         containerPort: 3000,
//     }],
// });

// // Create a CloudWatch Log Group for the ECS task logs
// const logGroup = new aws.cloudwatch.LogGroup("LogGroup", {
//     // It's good practice to specify the retention policy
//     retentionInDays: 30,
// });

// Outputs
export const url = alb.dnsName;
