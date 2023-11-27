import * as aws from "@pulumi/aws";
import { SecurityGroup } from "@pulumi/aws/ec2";
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
let secGroup = new aws.ec2.SecurityGroup(sgName, {
    vpcId: vpc.vpcId,
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

const alb = new aws.lb.LoadBalancer("app-lb", {
    loadBalancerType: "application",
    subnets: vpc.publicSubnetIds,
    securityGroups: [secGroup.id],
});

const ecsSecurityGroup = new aws.ec2.SecurityGroup("ecsSecurityGroup", {
    vpcId: vpc.vpcId,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 3000, // The port your container is listening on
            toPort: 3000,
            securityGroups: [alb.securityGroups[0]], // Allow traffic from the ALB's security group
        },
    ],
    egress: [
        {
            protocol: "-1", // Allow all outbound traffic
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

const targetGroup = new aws.lb.TargetGroup("app-tg", {
    port: 3000,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.vpcId,
});

const httpListener = new aws.lb.Listener("http-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
});

// Define the task definition
const task = new awsx.ecs.FargateTaskDefinition("task", {
    executionRole:{
        skip: true
    },
    taskRole:{
        skip: true
    },
    containers: {
        app: {
            name: "latest",
            image: "philjim/warmandcozy:latest",
            memory: 512,
            portMappings: [{
                containerPort: 3000,
                name: "3000-tcp",
                protocol: "HTTP"
              }],
        },
    },
});

// Define the service
const service = new awsx.ecs.FargateService("service", {
    cluster: cluster.arn,
    taskDefinition: task.taskDefinition.arn,
    desiredCount: 1,
    networkConfiguration: {
        subnets: vpc.publicSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app", // The name of the container in your task definition
        containerPort: 3000,   // The port on which your container is listening
    }],
});

const logGroup = new aws.cloudwatch.LogGroup("LogGroup");

// Outputs
export const url = alb.dnsName;
