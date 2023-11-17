import com.google.firebase.database.DatabaseReference

class ParametersBuilder {
    val bundle = mutableMapOf<String, Any>()

    fun param(name: String, value: Any) {
        bundle[name] = value
    }
}

fun DatabaseReference.setValueAsyncQuick(setValue: ParametersBuilder.() -> Unit) {
    val parameters = ParametersBuilder()
    parameters.setValue()
    this.setValueAsync(parameters.bundle)
}