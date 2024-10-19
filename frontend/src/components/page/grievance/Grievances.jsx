import MainLayout from "@/components/layout/MainLayout"

const Grievances = () => {

  return (
    <MainLayout
        title={"Grievances"}
        buttonTitle={"Add Grievance"}
        buttonLink={"/grievances/add"}
    >
        <div>
            Grievances
        </div>
    </MainLayout>
  )
}

export default Grievances