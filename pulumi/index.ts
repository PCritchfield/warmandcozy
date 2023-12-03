import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { FargateService } from "@pulumi/awsx/ecs";

// Set the names of your resources
const vpcName = "myVPC";
const clusterName = "myCluster";
const sgName = "mySG";
const appName = "warmandcozy"; // Giving a clear name to the app for reference

// Create a new VPC
const vpc = new awsx.ec2.Vpc(vpcName, {});

const cluster = new aws.ecs.Cluster(clusterName, {
    // Enable Container Insights for the ECS Cluster
    settings: [
        {
            name: 'containerInsights',
            value: 'enabled',
        },
    ],
});
const capacityProviders = new aws.ecs.ClusterCapacityProviders("clusterCapacityProviderss", {
    clusterName: cluster.name,
    capacityProviders: ["FARGATE"],
    defaultCapacityProviderStrategies: [{
        base: 1,
        weight: 100,
        capacityProvider: "FARGATE",
    }],
});

// Create a Security Group for the ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(sgName, {
    vpcId: vpc.vpcId,
    description: "ALB security group",
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
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

// Create a Target Group for the Load Balancer
const targetGroup = new aws.lb.TargetGroup("app-tg", {
    port: 3000,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.vpcId,
});

// Create a Listener for the Load Balancer
const httpListener = new aws.lb.Listener("http-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
});

// Define the task definition
const task = new awsx.ecs.FargateTaskDefinition("task", {
    // Note: For Fargate tasks, 'family' is not needed, and 'cpu' and 'memory' are defined at the container level
    runtimePlatform:{
        operatingSystemFamily: "LINUX",
        cpuArchitecture: "X86_64"
    },
    memory: "4096",
    cpu: "2048",
    family: appName,
    container: {
        name: appName,
        image: "philjim/warmandcozy:latest",
        portMappings: [{ containerPort: 3000, hostPort: 3000, protocol: "tcp", appProtocol: "http"}],
        logConfiguration: {
            // Ensure you have a log configuration for debugging
            logDriver: "awslogs",
            options: {
                "awslogs-group": "/ecs/app", // Specify your CloudWatch Logs group
                "awslogs-region": "us-east-1", // Specify your AWS region
                "awslogs-stream-prefix": "ecs", // A prefix for the log streams
                "awslogs-create-group": "true"
            },
        },
    },
});

// Define the service
const service = new awsx.ecs.FargateService("service", {
    cluster: cluster.arn,
    schedulingStrategy: "REPLICA",
    taskDefinition: task.taskDefinition.arn,
    desiredCount: 1,
    networkConfiguration: {
        subnets: vpc.publicSubnetIds,
        securityGroups: [ecsSecurityGroup.id,albSecurityGroup.id],
        assignPublicIp: true
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: appName, // match the name defined in the containers map
        containerPort: 3000,
    }],
});

// Create a CloudWatch Log Group for the ECS task logs
const logGroup = new aws.cloudwatch.LogGroup("LogGroup", {
    // It's good practice to specify the retention policy
    retentionInDays: 30,
});

// Outputs
export const url = alb.dnsName;
