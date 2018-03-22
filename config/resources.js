const { tableConfig } = require('./dynamodb');
const { getStage, loadConfig } = require('./util');

function capitalizeWord(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

const memoryUsedFilter = '[report_name="REPORT", request_id_name="RequestId:", request_id_value, duration_name="Duration:", duration_value, duration_unit="ms", billed_duration_name_1="Billed", bill_duration_name_2="Duration:", billed_duration_value, billed_duration_unit="ms", memory_size_name_1="Memory", memory_size_name_2="Size:", memory_size_value, memory_size_unit="MB", max_memory_used_name_1="Max", max_memory_used_name_2="Memory", max_memory_used_name_3="Used:", max_memory_used_value, max_memory_used_unit="MB"]'; // eslint-disable-line max-len
const metricFilterConfigs = {
    MemoryUsed: {
        FilterPattern: memoryUsedFilter,
        MetricTransformations: [
            {
                MetricValue: '$max_memory_used_value',
                MetricNamespace: 'LambdaMemoryUsed',
            },
        ],
    },

};
function metricFilters(stage) {
    return loadConfig()
        .then((config) => {
            const names = Object.keys(config.functions).map((key) => {
                if ('name' in config.functions[key]) {
                    return config.functions[key].name;
                }
                return key;
            });
            return names.reduce((acc, name) => {
                const fullName = `${config.service}-${stage}-${name}`;
                return Object.assign(acc, Object.keys(metricFilterConfigs)
                    .reduce((allMetrics, type) => {
                        allMetrics[`${capitalizeWord(name)}MetricFilter${type}`] = {
                            Type: 'AWS::Logs::MetricFilter',
                            DependsOn: [ `${capitalizeWord(name)}LogGroup` ],
                            Properties: Object.assign({}, metricFilterConfigs[type], {
                                LogGroupName: `/aws/lambda/${fullName}`,
                                MetricTransformations:
                                    metricFilterConfigs[type].MetricTransformations.map(
                                        (transform) => Object.assign(
                                            {},
                                            transform,
                                            { MetricName: name }
                                        )
                                    ),
                            }),
                        };
                        return allMetrics;
                    },
                    {}));
            }, {});
        });
}

module.exports = () => {
    return getStage().then((stage) => Promise.all([
        tableConfig(stage),
        metricFilters(stage),
    ])).then((parts) => parts.reduce((acc, part) => Object.assign(acc, part), {}));
};
